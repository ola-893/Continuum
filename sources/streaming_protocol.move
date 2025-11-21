// ===================================================================
// sources/streaming_protocol.move
// Core Streaming Protocol Module with REAL MONEY
// ===================================================================
module aptos_rwa::streaming_protocol {
    use std::signer;
    use std::error;
    use aptos_framework::timestamp;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    // Make StreamRegistry and functions accessible to other modules
    friend aptos_rwa::asset_yield_protocol;
    friend aptos_rwa::compliance_guard;
    friend aptos_rwa::rwa_hub;

    // Error codes
    const E_STREAM_NOT_FOUND: u64 = 1;
    const E_STREAM_NOT_ACTIVE: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_INVALID_PARAMETERS: u64 = 4;
    const E_NO_FUNDS_TO_WITHDRAW: u64 = 5;
    const E_INSUFFICIENT_FUNDS: u64 = 6;

    /// Stream status enumeration
    const STREAM_STATUS_ACTIVE: u8 = 0;
    const STREAM_STATUS_PAUSED: u8 = 1;
    const STREAM_STATUS_CANCELLED: u8 = 2;
    const STREAM_STATUS_DEPLETED: u8 = 3;

    /// Core stream data structure with REAL COIN ESCROW
    struct StreamInfo<phantom CoinType> has store {
        sender: address,
        recipient: address,
        escrow: Coin<CoinType>, // ACTUAL MONEY HELD HERE
        total_amount: u64,
        flow_rate: u64,
        start_time: u64,
        stop_time: u64,
        amount_withdrawn: u64,
        status: u8,
        is_asset_stream: bool,
    }

    /// Stream registry with generic coin type
    struct StreamRegistry<phantom CoinType> has key {
        streams: Table<u64, StreamInfo<CoinType>>,
        next_stream_id: u64,
        stream_created_events: EventHandle<StreamCreatedEvent>,
        stream_withdrawn_events: EventHandle<StreamWithdrawnEvent>,
        stream_cancelled_events: EventHandle<StreamCancelledEvent>,
        flash_advance_events: EventHandle<FlashAdvanceEvent>,
    }

    struct StreamCreatedEvent has drop, store {
        stream_id: u64,
        sender: address,
        recipient: address,
        total_amount: u64,
        start_time: u64,
    }

    struct StreamWithdrawnEvent has drop, store {
        stream_id: u64,
        recipient: address,
        amount: u64,
    }

    struct StreamCancelledEvent has drop, store {
        stream_id: u64,
        sender: address,
        recipient: address,
        refunded_amount: u64,
    }

    struct FlashAdvanceEvent has drop, store {
        stream_id: u64,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    /// Initialize the streaming protocol for a specific coin type
    public entry fun initialize<CoinType>(account: &signer) {
        let account_addr = signer::address_of(account);
        
        if (!exists<StreamRegistry<CoinType>>(account_addr)) {
            move_to(account, StreamRegistry<CoinType> {
                streams: table::new(),
                next_stream_id: 1,
                stream_created_events: account::new_event_handle<StreamCreatedEvent>(account),
                stream_withdrawn_events: account::new_event_handle<StreamWithdrawnEvent>(account),
                stream_cancelled_events: account::new_event_handle<StreamCancelledEvent>(account),
                flash_advance_events: account::new_event_handle<FlashAdvanceEvent>(account),
            });
        }
    }

    /// Create a stream and LOCK REAL FUNDS
    public(friend) fun create_stream<CoinType>(
        registry: &mut StreamRegistry<CoinType>,
        sender: &signer,
        recipient: address,
        flow_rate: u64,
        start_time: u64,
        duration: u64,
        total_amount: u64,
    ): u64 {
        let sender_addr = signer::address_of(sender);
        
        // Validate parameters
        assert!(total_amount > 0, error::invalid_argument(E_INVALID_PARAMETERS));
        assert!(duration > 0, error::invalid_argument(E_INVALID_PARAMETERS));
        assert!(flow_rate > 0, error::invalid_argument(E_INVALID_PARAMETERS));

        // 1. WITHDRAW REAL MONEY FROM SENDER
        let coins = coin::withdraw<CoinType>(sender, total_amount);

        let stream_id = registry.next_stream_id;
        registry.next_stream_id = stream_id + 1;

        let stop_time = start_time + duration;

        let stream = StreamInfo {
            sender: sender_addr,
            recipient,
            escrow: coins, // 2. STORE MONEY IN CONTRACT
            total_amount,
            flow_rate,
            start_time,
            stop_time,
            amount_withdrawn: 0,
            status: STREAM_STATUS_ACTIVE,
            is_asset_stream: false,
        };

        table::add(&mut registry.streams, stream_id, stream);

        event::emit_event(&mut registry.stream_created_events, StreamCreatedEvent {
            stream_id,
            sender: sender_addr,
            recipient,
            total_amount,
            start_time,
        });

        stream_id
    }

    /// Calculate claimable balance using lazy evaluation
    public fun claimable_balance_of<CoinType>(
        registry: &StreamRegistry<CoinType>,
        stream_id: u64,
    ): u64 {
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        let stream = table::borrow(&registry.streams, stream_id);
        
        assert!(stream.status == STREAM_STATUS_ACTIVE, error::invalid_state(E_STREAM_NOT_ACTIVE));

        let current_time = timestamp::now_seconds();

        if (current_time < stream.start_time) {
            return 0
        };

        if (current_time >= stream.stop_time) {
            return stream.total_amount - stream.amount_withdrawn
        };

        let time_elapsed = current_time - stream.start_time;
        let streamed_amount = time_elapsed * stream.flow_rate;
        
        if (streamed_amount > stream.amount_withdrawn) {
            streamed_amount - stream.amount_withdrawn
        } else {
            0
        }
    }

    /// Withdraw from stream and TRANSFER REAL MONEY
    public(friend) fun withdraw<CoinType>(
        registry: &mut StreamRegistry<CoinType>,
        stream_id: u64,
        recipient: &signer,
    ): u64 {
        let recipient_addr = signer::address_of(recipient);
        
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        
        let claimable = claimable_balance_of<CoinType>(registry, stream_id);
        assert!(claimable > 0, error::invalid_state(E_NO_FUNDS_TO_WITHDRAW));

        let stream = table::borrow_mut(&mut registry.streams, stream_id);
        assert!(recipient_addr == stream.recipient, error::permission_denied(E_NOT_AUTHORIZED));
        
        stream.amount_withdrawn = stream.amount_withdrawn + claimable;

        // 3. EXTRACT MONEY FROM ESCROW
        let extracted_coins = coin::extract(&mut stream.escrow, claimable);
        
        // 4. DEPOSIT TO RECIPIENT
        if (!coin::is_account_registered<CoinType>(recipient_addr)) {
            coin::register<CoinType>(recipient);
        };
        coin::deposit(recipient_addr, extracted_coins);

        event::emit_event(&mut registry.stream_withdrawn_events, StreamWithdrawnEvent {
            stream_id,
            recipient: recipient_addr,
            amount: claimable,
        });

        claimable
    }

    /// Flash advance - THE INNOVATION
    public(friend) fun flash_advance<CoinType>(
        registry: &mut StreamRegistry<CoinType>,
        stream_id: u64,
        recipient: &signer,
        amount_requested: u64,
    ) {
        let recipient_addr = signer::address_of(recipient);
        
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        let stream = table::borrow_mut(&mut registry.streams, stream_id);

        // 1. Security Checks
        assert!(stream.recipient == recipient_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(stream.status == STREAM_STATUS_ACTIVE, error::invalid_state(E_STREAM_NOT_ACTIVE));
        
        // 2. Calculate Remaining Global Balance
        let total_remaining = stream.total_amount - stream.amount_withdrawn;
        
        // Ensure we don't withdraw more than what exists in the escrow
        assert!(amount_requested <= total_remaining, error::invalid_argument(E_INSUFFICIENT_FUNDS));

        // 3. The Innovation: "Time Travel"
        stream.amount_withdrawn = stream.amount_withdrawn + amount_requested;

        // 4. Transfer the Money Now
        let coins = coin::extract(&mut stream.escrow, amount_requested);
        
        if (!coin::is_account_registered<CoinType>(recipient_addr)) {
            coin::register<CoinType>(recipient);
        };
        coin::deposit(recipient_addr, coins);

        event::emit_event(&mut registry.flash_advance_events, FlashAdvanceEvent {
            stream_id,
            recipient: recipient_addr,
            amount: amount_requested,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Cancel stream and return remaining funds
    public fun cancel<CoinType>(
        registry: &mut StreamRegistry<CoinType>,
        stream_id: u64,
        caller: &signer,
    ) {
        let caller_addr = signer::address_of(caller);
        
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        let stream = table::borrow_mut(&mut registry.streams, stream_id);
        
        assert!(
            caller_addr == stream.sender || caller_addr == stream.recipient,
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        let remaining_balance = coin::value(&stream.escrow);
        
        if (remaining_balance > 0) {
            let refund_coins = coin::extract_all(&mut stream.escrow);
            
            if (!coin::is_account_registered<CoinType>(stream.sender)) {
                coin::destroy_zero(refund_coins);
            } else {
                coin::deposit(stream.sender, refund_coins);
            };
        };

        stream.status = STREAM_STATUS_CANCELLED;

        event::emit_event(&mut registry.stream_cancelled_events, StreamCancelledEvent {
            stream_id,
            sender: stream.sender,
            recipient: stream.recipient,
            refunded_amount: remaining_balance,
        });
    }

    /// Create a stream given an address (wrapper for cross-module access)
    public(friend) fun create_stream_with_addr<CoinType>(
        registry_addr: address,
        sender: &signer,
        recipient: address,
        flow_rate: u64,
        start_time: u64,
        duration: u64,
        total_amount: u64,
    ): u64 acquires StreamRegistry {
        let registry = borrow_global_mut<StreamRegistry<CoinType>>(registry_addr);
        create_stream<CoinType>(registry, sender, recipient, flow_rate, start_time, duration, total_amount)
    }

    /// Claimable balance wrapper for cross-module access
    public(friend) fun claimable_balance_with_addr<CoinType>(
        registry_addr: address,
        stream_id: u64,
    ): u64 acquires StreamRegistry {
        let registry = borrow_global<StreamRegistry<CoinType>>(registry_addr);
        claimable_balance_of<CoinType>(registry, stream_id)
    }

    /// Withdraw wrapper for cross-module access
    public(friend) fun withdraw_with_addr<CoinType>(
        registry_addr: address,
        stream_id: u64,
        recipient: &signer,
    ): u64 acquires StreamRegistry {
        let registry = borrow_global_mut<StreamRegistry<CoinType>>(registry_addr);
        withdraw<CoinType>(registry, stream_id, recipient)
    }

    /// Flash advance wrapper for cross-module access
    public(friend) fun flash_advance_with_addr<CoinType>(
        registry_addr: address,
        stream_id: u64,
        recipient: &signer,
        amount_requested: u64,
    ) acquires StreamRegistry {
        let registry = borrow_global_mut<StreamRegistry<CoinType>>(registry_addr);
        flash_advance<CoinType>(registry, stream_id, recipient, amount_requested)
    }

    /// Update recipient wrapper for cross-module access
    public(friend) fun update_recipient_with_addr<CoinType>(
        registry_addr: address,
        stream_id: u64,
        new_recipient: address,
    ) acquires StreamRegistry {
        let registry = borrow_global_mut<StreamRegistry<CoinType>>(registry_addr);
        update_recipient<CoinType>(registry, stream_id, new_recipient)
    }

    /// Update status wrapper for cross-module access
    public(friend) fun update_status_with_addr<CoinType>(
        registry_addr: address,
        stream_id: u64,
        new_status: u8,
    ) acquires StreamRegistry {
        let registry = borrow_global_mut<StreamRegistry<CoinType>>(registry_addr);
        update_status<CoinType>(registry, stream_id, new_status)
    }

    #[view]
    public fun get_stream_info<CoinType>(
        registry_addr: address,
        stream_id: u64,
    ): (address, address, u64, u64, u64, u64, u64, u8) acquires StreamRegistry {
        let registry = borrow_global<StreamRegistry<CoinType>>(registry_addr);
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        let stream = table::borrow(&registry.streams, stream_id);
        
        (
            stream.sender,
            stream.recipient,
            stream.total_amount,
            stream.flow_rate,
            stream.start_time,
            stream.stop_time,
            stream.amount_withdrawn,
            stream.status
        )
    }

    /// Update stream status
    public(friend) fun update_status<CoinType>(
        registry: &mut StreamRegistry<CoinType>,
        stream_id: u64,
        new_status: u8,
    ) {
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        let stream = table::borrow_mut(&mut registry.streams, stream_id);
        stream.status = new_status;
    }

    /// Update stream recipient (for RWA ownership transfers)
    public(friend) fun update_recipient<CoinType>(
        registry: &mut StreamRegistry<CoinType>,
        stream_id: u64,
        new_recipient: address,
    ) {
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        let stream = table::borrow_mut(&mut registry.streams, stream_id);
        stream.recipient = new_recipient;
    }

    #[view]
    public fun get_escrow_balance<CoinType>(
        registry_addr: address,
        stream_id: u64,
    ): u64 acquires StreamRegistry {
        let registry = borrow_global<StreamRegistry<CoinType>>(registry_addr);
        assert!(table::contains(&registry.streams, stream_id), error::not_found(E_STREAM_NOT_FOUND));
        let stream = table::borrow(&registry.streams, stream_id);
        coin::value(&stream.escrow)
    }
}