"""
Streaming Protocol Contract

Purpose: Manages time-based token streaming with escrow, withdrawal, and flash advance functionality.

This contract implements the core streaming logic for the Continuum Protocol on Tezos.
It handles:
- Stream creation with token escrow
- Time-based claimable balance calculation
- Recipient withdrawals
- Flash advance (immediate withdrawal of future yield)
- Stream cancellation

Requirements: 1.1-1.10
"""

import smartpy as sp

@sp.module
def main():
    # Define stream record type
    stream_record_type: type = sp.record(
        sender=sp.address,
        recipient=sp.address,
        token_address=sp.address,
        token_id=sp.nat,
        total_amount=sp.nat,
        flow_rate=sp.nat,
        start_time=sp.timestamp,
        stop_time=sp.timestamp,
        amount_withdrawn=sp.nat,
        status=sp.nat
    )
    
    class StreamingProtocol(sp.Contract):
        """
        Streaming Protocol Contract
        
        Manages time-based token streaming with escrow, withdrawal, and flash advance.
        """
        
        def __init__(self, admin):
            """
            Initialize the streaming protocol contract.
            
            Args:
                admin: Administrator address
            """
            self.data.streams = sp.cast(sp.big_map(), sp.big_map[sp.nat, stream_record_type])
            self.data.next_stream_id = sp.nat(0)
            self.data.admin = sp.cast(admin, sp.address)
            self.data.paused = False  # Emergency pause flag
        
        @sp.entrypoint
        def create_stream(self, recipient, token_address, token_id, flow_rate, duration, total_amount):
            """
            Create a new token stream with escrow.
            
            Args:
                recipient: Address that will receive the streamed tokens
                token_address: FA2 contract address for the token
                token_id: FA2 token ID
                flow_rate: Tokens per second
                duration: Stream duration in seconds
                total_amount: Total tokens to lock in escrow
            
            Returns:
                stream_id via event emission
            
            Requirements: 1.1, 1.8, 17.5
            """
            # Check if contract is paused
            assert not self.data.paused, "CONTRACT_PAUSED: Operations are temporarily suspended"
            
            # Validate input parameters - numeric inputs
            assert total_amount > 0, "INVALID_PARAMETERS: total_amount must be > 0"
            assert duration > 0, "INVALID_PARAMETERS: duration must be > 0"
            assert flow_rate > 0, "INVALID_PARAMETERS: flow_rate must be > 0"
            
            # Validate reasonable duration (max 10 years = 315360000 seconds)
            assert duration <= 315360000, "INVALID_PARAMETERS: duration exceeds maximum (10 years)"
            
            # Validate total_amount matches flow_rate * duration (prevent overflow)
            expected_total = flow_rate * duration
            assert total_amount == expected_total, "INVALID_PARAMETERS: total_amount must equal flow_rate * duration"
            
            # Validate addresses are well-formed (SmartPy handles this, but we add explicit check)
            assert recipient != sp.address("tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU"), "INVALID_PARAMETERS: recipient cannot be burn address"
            assert token_address != sp.address("tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU"), "INVALID_PARAMETERS: token_address cannot be burn address"
            
            # Calculate timestamps
            start_time = sp.now
            stop_time = start_time.add_seconds(sp.to_int(duration))
            
            # Transfer tokens from sender to contract (escrow)
            # FA2 transfer format: list of transfer operations
            transfer_param = sp.record(
                from_=sp.sender,
                txs=[
                    sp.record(
                        to_=sp.self_address(),
                        token_id=token_id,
                        amount=total_amount
                    )
                ]
            )
            
            fa2_contract = sp.contract(
                sp.list[sp.record(
                    from_=sp.address,
                    txs=sp.list[sp.record(to_=sp.address, token_id=sp.nat, amount=sp.nat)]
                )],
                token_address,
                "transfer"
            ).unwrap_some(error="INVALID_TOKEN_CONTRACT")
            
            sp.transfer([transfer_param], sp.mutez(0), fa2_contract)
            
            # Create stream record
            stream_id = self.data.next_stream_id
            self.data.streams[stream_id] = sp.record(
                sender=sp.sender,
                recipient=recipient,
                token_address=token_address,
                token_id=token_id,
                total_amount=total_amount,
                flow_rate=flow_rate,
                start_time=start_time,
                stop_time=stop_time,
                amount_withdrawn=0,
                status=0  # STATUS_ACTIVE
            )
            
            # Increment stream ID counter
            self.data.next_stream_id += 1
            
            # Emit stream creation event
            sp.emit(
                sp.record(
                    stream_id=stream_id,
                    sender=sp.sender,
                    recipient=recipient,
                    token_address=token_address,
                    token_id=token_id,
                    total_amount=total_amount,
                    flow_rate=flow_rate,
                    start_time=start_time,
                    stop_time=stop_time
                ),
                tag="stream_created"
            )
        
        @sp.onchain_view()
        def get_claimable_balance(self, stream_id):
            """
            Calculate the claimable balance for a stream at the current time.
            
            Args:
                stream_id: The ID of the stream
            
            Returns:
                The amount of tokens that can be withdrawn now
            
            Requirements: 1.2
            """
            # Return zero for invalid stream IDs
            assert self.data.streams.contains(stream_id), "STREAM_NOT_FOUND"
            
            stream = self.data.streams[stream_id]
            
            # Return zero if stream is not active
            if stream.status != 0:  # STATUS_ACTIVE
                return sp.nat(0)
            
            # Return zero if before start_time
            if sp.now < stream.start_time:
                return sp.nat(0)
            
            # Calculate elapsed time
            elapsed_seconds = sp.as_nat(sp.now - stream.start_time)
            
            # Calculate streamed amount: elapsed_seconds * flow_rate
            streamed_amount = elapsed_seconds * stream.flow_rate
            
            # Cap at total_amount (handle case after stop_time)
            total_streamed = sp.min(streamed_amount, stream.total_amount)
            
            # Subtract amount already withdrawn
            if total_streamed >= stream.amount_withdrawn:
                claimable = sp.as_nat(total_streamed - stream.amount_withdrawn)
            else:
                claimable = sp.nat(0)
            
            return claimable
        
        @sp.entrypoint
        def withdraw(self, stream_id):
            """
            Withdraw accumulated tokens from a stream.
            
            Args:
                stream_id: The ID of the stream to withdraw from
            
            Requirements: 1.3, 1.10
            """
            # Check if contract is paused
            assert not self.data.paused, "CONTRACT_PAUSED: Operations are temporarily suspended"
            
            # Verify stream exists
            assert self.data.streams.contains(stream_id), "STREAM_NOT_FOUND"
            
            stream = self.data.streams[stream_id]
            
            # Verify caller is stream recipient
            assert sp.sender == stream.recipient, "NOT_AUTHORIZED: Only recipient can withdraw"
            
            # Verify stream is active
            assert stream.status == 0, "STREAM_NOT_ACTIVE"  # STATUS_ACTIVE
            
            # Calculate claimable balance
            if sp.now >= stream.start_time:
                elapsed_seconds = sp.as_nat(sp.now - stream.start_time)
            else:
                elapsed_seconds = sp.nat(0)
            streamed_amount = elapsed_seconds * stream.flow_rate
            total_streamed = sp.min(streamed_amount, stream.total_amount)
            if total_streamed >= stream.amount_withdrawn:
                claimable = sp.as_nat(total_streamed - stream.amount_withdrawn)
            else:
                claimable = sp.nat(0)
            
            # Verify there are funds to withdraw
            assert claimable > 0, "NO_FUNDS_TO_WITHDRAW"
            
            # STATE-BEFORE-CALL PATTERN: Update amount_withdrawn BEFORE external call (prevent reentrancy)
            # This is critical for security - state must be updated before any external calls
            self.data.streams[stream_id].amount_withdrawn += claimable
            
            # Transfer tokens from contract to recipient
            transfer_param = sp.record(
                from_=sp.self_address(),
                txs=[
                    sp.record(
                        to_=stream.recipient,
                        token_id=stream.token_id,
                        amount=claimable
                    )
                ]
            )
            
            fa2_contract = sp.contract(
                sp.list[sp.record(
                    from_=sp.address,
                    txs=sp.list[sp.record(to_=sp.address, token_id=sp.nat, amount=sp.nat)]
                )],
                stream.token_address,
                "transfer"
            ).unwrap_some(error="INVALID_TOKEN_CONTRACT")
            
            sp.transfer([transfer_param], sp.mutez(0), fa2_contract)
            
            # Emit withdrawal event
            sp.emit(
                sp.record(
                    stream_id=stream_id,
                    recipient=stream.recipient,
                    amount=claimable,
                    timestamp=sp.now
                ),
                tag="withdrawal"
            )
        
        @sp.entrypoint
        def flash_advance(self, stream_id, amount_requested):
            """
            Immediately withdraw future yield (flash advance).
            
            Args:
                stream_id: The ID of the stream
                amount_requested: Amount to withdraw immediately
            
            Requirements: 1.4, 17.5
            """
            # Check if contract is paused
            assert not self.data.paused, "CONTRACT_PAUSED: Operations are temporarily suspended"
            
            # Validate input parameters
            assert amount_requested > 0, "INVALID_PARAMETERS: amount_requested must be > 0"
            
            # Verify stream exists
            assert self.data.streams.contains(stream_id), "STREAM_NOT_FOUND"
            
            stream = self.data.streams[stream_id]
            
            # Verify caller is stream recipient
            assert sp.sender == stream.recipient, "NOT_AUTHORIZED: Only recipient can flash advance"
            
            # Verify stream is active
            assert stream.status == 0, "STREAM_NOT_ACTIVE"  # STATUS_ACTIVE
            
            # Validate amount_requested <= (total_amount - amount_withdrawn)
            remaining_balance = sp.as_nat(stream.total_amount - stream.amount_withdrawn)
            assert amount_requested <= remaining_balance, "INSUFFICIENT_FUNDS: Requested amount exceeds remaining balance"
            
            # STATE-BEFORE-CALL PATTERN: Update amount_withdrawn BEFORE external call (prevent reentrancy)
            # This is critical for security - state must be updated before any external calls
            self.data.streams[stream_id].amount_withdrawn += amount_requested
            
            # Transfer tokens immediately
            transfer_param = sp.record(
                from_=sp.self_address(),
                txs=[
                    sp.record(
                        to_=stream.recipient,
                        token_id=stream.token_id,
                        amount=amount_requested
                    )
                ]
            )
            
            fa2_contract = sp.contract(
                sp.list[sp.record(
                    from_=sp.address,
                    txs=sp.list[sp.record(to_=sp.address, token_id=sp.nat, amount=sp.nat)]
                )],
                stream.token_address,
                "transfer"
            ).unwrap_some(error="INVALID_TOKEN_CONTRACT")
            
            sp.transfer([transfer_param], sp.mutez(0), fa2_contract)
            
            # Emit flash advance event
            sp.emit(
                sp.record(
                    stream_id=stream_id,
                    recipient=stream.recipient,
                    amount=amount_requested,
                    timestamp=sp.now
                ),
                tag="flash_advance"
            )
        
        @sp.entrypoint
        def cancel_stream(self, stream_id):
            """
            Cancel a stream and refund remaining balance to sender.
            
            Args:
                stream_id: The ID of the stream to cancel
            
            Requirements: 1.5
            """
            # Check if contract is paused
            assert not self.data.paused, "CONTRACT_PAUSED: Operations are temporarily suspended"
            
            # Verify stream exists
            assert self.data.streams.contains(stream_id), "STREAM_NOT_FOUND"
            
            stream = self.data.streams[stream_id]
            
            # Verify caller is sender or recipient
            assert (sp.sender == stream.sender) | (sp.sender == stream.recipient), \
                "NOT_AUTHORIZED: Only sender or recipient can cancel"
            
            # Verify stream is active
            assert stream.status == 0, "STREAM_NOT_ACTIVE"  # STATUS_ACTIVE
            
            # Calculate remaining balance
            if stream.total_amount >= stream.amount_withdrawn:
                remaining_balance = sp.as_nat(stream.total_amount - stream.amount_withdrawn)
            else:
                remaining_balance = sp.nat(0)
            
            # STATE-BEFORE-CALL PATTERN: Mark stream as cancelled BEFORE external call (prevent reentrancy)
            # This is critical for security - state must be updated before any external calls
            self.data.streams[stream_id].status = 2  # STATUS_CANCELLED
            
            # Transfer remaining tokens back to sender (if any)
            if remaining_balance > 0:
                transfer_param = sp.record(
                    from_=sp.self_address(),
                    txs=[
                        sp.record(
                            to_=stream.sender,
                            token_id=stream.token_id,
                            amount=remaining_balance
                        )
                    ]
                )
                
                fa2_contract = sp.contract(
                    sp.list[sp.record(
                        from_=sp.address,
                        txs=sp.list[sp.record(to_=sp.address, token_id=sp.nat, amount=sp.nat)]
                    )],
                    stream.token_address,
                    "transfer"
                ).unwrap_some(error="INVALID_TOKEN_CONTRACT")
                
                sp.transfer([transfer_param], sp.mutez(0), fa2_contract)
            
            # Emit cancellation event
            sp.emit(
                sp.record(
                    stream_id=stream_id,
                    cancelled_by=sp.sender,
                    refund_amount=remaining_balance,
                    timestamp=sp.now
                ),
                tag="stream_cancelled"
            )
        
        @sp.onchain_view()
        def get_stream_info(self, stream_id):
            """
            Get complete stream information.
            
            Args:
                stream_id: The ID of the stream
            
            Returns:
                Complete stream record
            """
            assert self.data.streams.contains(stream_id), "STREAM_NOT_FOUND"
            return self.data.streams[stream_id]
        
        @sp.onchain_view()
        def get_escrow_balance(self, stream_id):
            """
            Get remaining escrow balance for a stream.
            
            Args:
                stream_id: The ID of the stream
            
            Returns:
                Remaining tokens in escrow
            """
            assert self.data.streams.contains(stream_id), "STREAM_NOT_FOUND"
            stream = self.data.streams[stream_id]
            if stream.total_amount >= stream.amount_withdrawn:
                return sp.as_nat(stream.total_amount - stream.amount_withdrawn)
            else:
                return sp.nat(0)

        @sp.entrypoint
        def update_recipient(self, stream_id, new_recipient):
            """
            Update the recipient of a stream (called by asset yield protocol on NFT transfer).
            
            Args:
                stream_id: The ID of the stream to update
                new_recipient: The new recipient address
            
            Requirements: 2.2 (via Asset Yield Protocol)
            """
            # Verify stream exists
            assert self.data.streams.contains(stream_id), "STREAM_NOT_FOUND"
            
            # Update the recipient
            self.data.streams[stream_id].recipient = new_recipient
            
            # Emit recipient update event
            sp.emit(
                sp.record(
                    stream_id=stream_id,
                    new_recipient=new_recipient,
                    timestamp=sp.now
                ),
                tag="recipient_updated"
            )
        
        @sp.entrypoint
        def pause(self):
            """
            Emergency pause all contract operations (admin only).
            
            Requirements: 17.7
            """
            # Verify caller is admin
            assert sp.sender == self.data.admin, "NOT_ADMIN: Only admin can pause contract"
            
            # Verify contract is not already paused
            assert not self.data.paused, "ALREADY_PAUSED: Contract is already paused"
            
            # Pause the contract
            self.data.paused = True
            
            # Emit pause event
            sp.emit(
                sp.record(
                    paused_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="contract_paused"
            )
        
        @sp.entrypoint
        def unpause(self):
            """
            Resume contract operations after emergency pause (admin only).
            
            Requirements: 17.7
            """
            # Verify caller is admin
            assert sp.sender == self.data.admin, "NOT_ADMIN: Only admin can unpause contract"
            
            # Verify contract is paused
            assert self.data.paused, "NOT_PAUSED: Contract is not paused"
            
            # Unpause the contract
            self.data.paused = False
            
            # Emit unpause event
            sp.emit(
                sp.record(
                    unpaused_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="contract_unpaused"
            )
