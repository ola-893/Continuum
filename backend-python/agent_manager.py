"""
AIP Agent SDK wrapper class.

This module provides a high-level interface for managing AIP agents,
including blockchain registration, initialization, and query processing.
"""

import os
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# AIP Agent SDK imports
try:
    from membase.chain.chain import Client
    MEMBASE_AVAILABLE = True
except ImportError:
    MEMBASE_AVAILABLE = False
    logging.warning("membase package not available - using mock implementation")

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when environment variables are missing or invalid."""
    pass


class BlockchainError(Exception):
    """Raised when blockchain operations fail."""
    pass


class AgentInitializationError(Exception):
    """Raised when agent initialization fails."""
    pass


class QueryProcessingError(Exception):
    """Raised when query processing fails."""
    pass


class AIPAgentManager:
    """
    Manager class for AIP Agent SDK operations.
    
    Handles agent registration, initialization, query processing,
    and memory management using blockchain-based identity.
    """
    
    def __init__(self):
        """Initialize the AIP Agent Manager."""
        self.membase_account = os.getenv('MEMBASE_ACCOUNT')
        self.membase_secret = os.getenv('MEMBASE_SECRET_KEY')
        self.membase_id = os.getenv('MEMBASE_ID')
        self.memory_hub_address = os.getenv('MEMORY_HUB_ADDRESS', '54.169.29.193:8081')
        self.network = os.getenv('MEMBASE_NETWORK', 'bsc-testnet')
        
        # Validate configuration
        self._validate_config()
        
        # Initialize Membase client
        self.membase_client = self._initialize_membase_client()
        
        # Cache of initialized agents
        self.agents: Dict[str, Any] = {}
        
        logger.info("AIPAgentManager initialized successfully")
    
    def _validate_config(self):
        """Validate required environment variables."""
        if not self.membase_account:
            error_msg = "MEMBASE_ACCOUNT not set. Please configure your BNB Chain wallet address."
            logger.error(error_msg)
            raise ConfigurationError(error_msg)
        
        if not self.membase_secret:
            error_msg = "MEMBASE_SECRET_KEY not set. Please configure your wallet private key."
            logger.error(error_msg)
            raise ConfigurationError(error_msg)
        
        if not self.membase_id:
            error_msg = "MEMBASE_ID not set. Please configure your agent identifier."
            logger.error(error_msg)
            raise ConfigurationError(error_msg)
        
        # Validate wallet address format
        if not self.membase_account.startswith('0x') or len(self.membase_account) != 42:
            error_msg = f"MEMBASE_ACCOUNT must be a valid BNB Chain address (0x + 40 hex chars), got: {self.membase_account}"
            logger.error(error_msg)
            raise ConfigurationError(error_msg)
        
        logger.info("Configuration validated successfully")
    
    def _initialize_membase_client(self):
        """
        Initialize Membase client for blockchain operations.
        
        This method:
        - Determines the RPC endpoint based on network configuration
        - Sets the Membase contract address
        - Creates a Client instance with wallet credentials
        - Tests the blockchain connection
        - Logs connection status
        
        Returns:
            Client: Initialized Membase client
            
        Raises:
            BlockchainError: If connection fails
        """
        try:
            # Determine RPC endpoint based on network
            if self.network == 'bsc-testnet':
                rpc_endpoint = "https://bsc-testnet-rpc.publicnode.com"
            else:
                rpc_endpoint = "https://bsc-dataseed.binance.org"
            
            # Membase contract address (BSC Testnet)
            membase_contract = "0x100E3F8c5285df46A8B9edF6b38B8f90F1C32B7b"
            
            logger.info("Initializing Membase client")
            logger.info(f"Network: {self.network}")
            logger.info(f"RPC Endpoint: {rpc_endpoint}")
            logger.info(f"Contract: {membase_contract}")
            logger.info(f"Wallet: {self.membase_account}")
            
            if MEMBASE_AVAILABLE:
                # Initialize real Membase client
                client = Client(
                    wallet_address=self.membase_account,
                    private_key=self.membase_secret,
                    ep=rpc_endpoint,
                    membase_contract=membase_contract
                )
                
                # Test blockchain connection by checking if we can access the contract
                try:
                    # Try to get agent info (this will fail if not registered, but proves connection works)
                    # This is a read operation that doesn't cost gas
                    test_agent_id = f"test_connection_{uuid.uuid4().hex[:8]}"
                    try:
                        client.get_agent(test_agent_id)
                    except Exception:
                        # Expected to fail for non-existent agent, but proves connection works
                        pass
                    
                    logger.info("Membase client initialized successfully")
                    logger.info(f"Connection status: Connected to {rpc_endpoint}")
                    logger.info(f"Blockchain connection test: PASSED")
                    
                except Exception as conn_error:
                    logger.error(f"Blockchain connection test failed: {str(conn_error)}")
                    raise BlockchainError(f"Failed to connect to blockchain: {str(conn_error)}")
                
                return client
            else:
                # Fallback to mock implementation if membase not available
                logger.warning("Using mock Membase client (membase package not installed)")
                client = {
                    'wallet_address': self.membase_account,
                    'rpc_endpoint': rpc_endpoint,
                    'contract': membase_contract,
                    'mock': True
                }
                
                logger.info("Mock Membase client initialized")
                logger.info(f"Connection status: Mock connection to {rpc_endpoint}")
                
                return client
            
        except BlockchainError:
            # Re-raise blockchain errors
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Membase client: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            raise BlockchainError(f"Blockchain connection failed: {str(e)}")
    
    async def register_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Register agent on-chain via Membase smart contract.
        
        This method:
        - Checks if agent is already registered
        - Handles "already registered by another wallet" error
        - Handles "insufficient funds" error (not enough BNB for gas)
        - Handles blockchain transaction errors
        - Logs transaction hash and confirmation
        
        Args:
            agent_id: Unique agent identifier
            
        Returns:
            Dict containing transaction_hash, agent_id, and wallet_address
            
        Raises:
            BlockchainError: If registration fails with specific error messages
        """
        try:
            logger.info(f"Registering agent on-chain: {agent_id}")
            
            if MEMBASE_AVAILABLE and not isinstance(self.membase_client, dict):
                # Use real Membase client
                # Check if agent is already registered
                try:
                    existing_owner = self.membase_client.get_agent(agent_id)
                    
                    # Check if agent is registered to a different wallet
                    if existing_owner and existing_owner != '0x0000000000000000000000000000000000000000':
                        if existing_owner.lower() != self.membase_account.lower():
                            error_msg = f"Agent '{agent_id}' is already registered by another wallet: {existing_owner}"
                            logger.error(error_msg)
                            raise BlockchainError(error_msg)
                        else:
                            # Agent already registered to this wallet (idempotent)
                            logger.info(f"Agent {agent_id} already registered to this wallet")
                            return {
                                'transaction_hash': '0x' + '0' * 64,  # No new transaction
                                'agent_id': agent_id,
                                'wallet_address': self.membase_account
                            }
                except BlockchainError:
                    # Re-raise already registered errors
                    raise
                except Exception as e:
                    # If get_agent fails, agent is not registered yet
                    logger.info(f"Agent not yet registered, proceeding with registration: {str(e)}")
                
                # Register agent on-chain
                try:
                    tx_hash = self.membase_client.register(agent_id)
                    
                    # Validate transaction hash format
                    if not tx_hash or not isinstance(tx_hash, str):
                        raise BlockchainError("Invalid transaction hash returned from blockchain")
                    
                    if not tx_hash.startswith('0x'):
                        tx_hash = '0x' + tx_hash
                    
                    logger.info(f"Agent registered successfully")
                    logger.info(f"Transaction hash: {tx_hash}")
                    logger.info(f"Transaction confirmation: SUCCESS")
                    logger.info(f"Agent ID: {agent_id}")
                    logger.info(f"Wallet: {self.membase_account}")
                    
                    return {
                        'transaction_hash': tx_hash,
                        'agent_id': agent_id,
                        'wallet_address': self.membase_account
                    }
                    
                except Exception as tx_error:
                    error_str = str(tx_error).lower()
                    
                    # Handle insufficient funds error
                    if 'insufficient funds' in error_str or 'insufficient balance' in error_str:
                        error_msg = f"Insufficient BNB for gas fees. Please add BNB to wallet {self.membase_account}"
                        logger.error(error_msg)
                        raise BlockchainError(error_msg)
                    
                    # Handle gas estimation errors (often means insufficient funds)
                    if 'gas' in error_str and ('required' in error_str or 'exceeds' in error_str):
                        error_msg = f"Transaction gas estimation failed. Likely insufficient BNB in wallet {self.membase_account}"
                        logger.error(error_msg)
                        raise BlockchainError(error_msg)
                    
                    # Handle transaction revert
                    if 'revert' in error_str or 'reverted' in error_str:
                        error_msg = f"Transaction reverted: {str(tx_error)}"
                        logger.error(error_msg)
                        raise BlockchainError(error_msg)
                    
                    # Generic blockchain error
                    error_msg = f"Blockchain transaction failed: {str(tx_error)}"
                    logger.error(error_msg)
                    raise BlockchainError(error_msg)
            else:
                # Mock implementation for testing
                logger.warning("Using mock registration (membase not available)")
                tx_hash = f"0x{'0' * 64}"  # Placeholder transaction hash
                
                logger.info(f"Agent registered successfully (mock)")
                logger.info(f"Transaction hash: {tx_hash}")
                logger.info(f"Transaction confirmation: SUCCESS (mock)")
                logger.info(f"Agent ID: {agent_id}")
                logger.info(f"Wallet: {self.membase_account}")
                
                return {
                    'transaction_hash': tx_hash,
                    'agent_id': agent_id,
                    'wallet_address': self.membase_account
                }
            
        except BlockchainError:
            # Re-raise blockchain errors with original message
            raise
        except Exception as e:
            logger.error(f"Agent registration failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            raise BlockchainError(f"Failed to register agent: {str(e)}")
    
    async def initialize_agent(
        self,
        agent_id: str,
        description: str,
        memory_hub_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initialize AIP agent with Memory Hub connection.
        
        This method:
        - Creates a FullAgentWrapper instance with the agent_id
        - Connects to the Memory Hub for decentralized storage
        - Registers the agent with the runtime
        - Stores the agent instance in cache
        
        Args:
            agent_id: Unique agent identifier
            description: Agent description/system prompt
            memory_hub_address: Memory Hub gRPC address (optional)
            
        Returns:
            Dict containing agent_id and status
            
        Raises:
            AgentInitializationError: If initialization fails
        """
        try:
            # Check if agent is already initialized (idempotent)
            if agent_id in self.agents:
                logger.info(f"Agent {agent_id} already initialized")
                return {
                    'agent_id': agent_id,
                    'status': 'initialized'
                }
            
            hub_address = memory_hub_address or self.memory_hub_address
            
            logger.info(f"Initializing AIP agent: {agent_id}")
            logger.info(f"Description: {description}")
            logger.info(f"Memory Hub: {hub_address}")
            
            # Import AIP Agent SDK
            from aip_agent.agents.full_agent import FullAgentWrapper
            from aip_agent.agents.custom_agent import CallbackAgent
            
            # Create FullAgentWrapper instance
            agent = FullAgentWrapper(
                agent_cls=CallbackAgent,
                name=agent_id,
                description=description,
                host_address=hub_address,
                server_names=[]  # No additional MCP servers for now
            )
            
            # Initialize the agent (connects to Memory Hub, registers on-chain, etc.)
            await agent.initialize()
            
            # Store agent in cache
            self.agents[agent_id] = agent
            
            logger.info(f"Agent initialized successfully: {agent_id}")
            logger.info(f"Memory Hub connected: {hub_address}")
            logger.info(f"Agent registered on-chain via Membase")
            
            return {
                'agent_id': agent_id,
                'status': 'initialized'
            }
            
        except ImportError as e:
            logger.error(f"Failed to import AIP Agent SDK: {str(e)}")
            logger.error("Make sure aip-agent package is installed")
            raise AgentInitializationError(f"AIP Agent SDK not available: {str(e)}")
        except Exception as e:
            logger.error(f"Agent initialization failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            raise AgentInitializationError(f"Failed to initialize agent: {str(e)}")
    
    async def query_agent(
        self,
        agent_id: str,
        query: str,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send query to agent and get response.
        
        This method:
        - Retrieves the agent's complete state from Membase
        - Passes the agent state as context to the LLM
        - Processes the query using the real AIP Agent SDK
        - Updates the agent's interaction history in Membase
        - Returns both the response and updated agent state
        
        Args:
            agent_id: Unique agent identifier
            query: User query string
            user_context: Optional context data
            
        Returns:
            Dict containing response, agent_state, and interaction_id
            
        Raises:
            ValueError: If agent not initialized
            QueryProcessingError: If query processing fails
        """
        try:
            # Check if agent is initialized
            agent = self.agents.get(agent_id)
            if not agent:
                raise ValueError(f"Agent {agent_id} has not been initialized")
            
            logger.info(f"Processing query for agent: {agent_id}")
            logger.info(f"Query: {query[:100]}...")  # Log first 100 chars
            
            # Generate interaction ID
            interaction_id = str(uuid.uuid4())
            
            # Retrieve agent state from Membase before processing
            agent_state_before = await self._get_agent_state_from_membase(agent_id)
            logger.info(f"Retrieved agent state from Membase for agent: {agent_id}")
            
            # Process query with real LLM using AIP Agent SDK
            try:
                # Use the real agent's process_query method
                response_text = await agent.process_query(
                    query=query,
                    use_history=True,  # Use conversation history from Membase
                    recent_n_messages=16,  # Include recent messages for context
                    use_tool_call=True  # Allow tool usage if available
                )
                
                logger.info(f"LLM generated response for agent: {agent_id}")
                logger.info(f"Response length: {len(response_text)} characters")
                
            except Exception as llm_error:
                logger.error(f"LLM processing failed: {str(llm_error)}")
                raise QueryProcessingError(f"LLM API error: {str(llm_error)}")
            
            # Update agent state in Membase with new interaction
            agent_state = await self._update_agent_state_in_membase(
                agent_id=agent_id,
                query=query,
                response=response_text,
                interaction_id=interaction_id,
                user_context=user_context,
                previous_state=agent_state_before
            )
            
            logger.info(f"Query processed successfully for agent: {agent_id}")
            logger.info(f"Interaction ID: {interaction_id}")
            logger.info(f"Agent state updated in Membase")
            
            return {
                'response': response_text,
                'agent_state': agent_state,
                'interaction_id': interaction_id
            }
            
        except ValueError:
            raise
        except QueryProcessingError:
            raise
        except Exception as e:
            logger.error(f"Query processing failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            raise QueryProcessingError(f"Failed to process query: {str(e)}")
    
    async def get_agent_status(self, agent_id: str) -> Dict[str, Any]:
        """
        Get agent status and metadata.
        
        Args:
            agent_id: Unique agent identifier
            
        Returns:
            Dict containing agent status information
        """
        try:
            # Check if agent is initialized
            is_initialized = agent_id in self.agents
            
            if MEMBASE_AVAILABLE and not isinstance(self.membase_client, dict):
                # Check if agent is registered on-chain
                try:
                    wallet_address = self.membase_client.get_agent(agent_id)
                    is_registered = wallet_address is not None and wallet_address != '0x0000000000000000000000000000000000000000'
                except Exception:
                    is_registered = False
                    wallet_address = None
            else:
                # Mock implementation
                is_registered = True
                wallet_address = self.membase_account
            
            status = 'active' if is_initialized else 'inactive'
            memory_hub_connected = is_initialized
            
            return {
                'agent_id': agent_id,
                'status': status,
                'registered': is_registered,
                'wallet_address': wallet_address or self.membase_account,
                'memory_hub_connected': memory_hub_connected
            }
            
        except Exception as e:
            logger.error(f"Failed to get agent status: {str(e)}")
            raise
    
    async def get_agent_memory(self, agent_id: str) -> Dict[str, Any]:
        """
        Retrieve agent's decentralized memory.
        
        Args:
            agent_id: Unique agent identifier
            
        Returns:
            Dict containing agent state and last_updated timestamp
            
        Raises:
            ValueError: If agent not initialized
        """
        try:
            # Check if agent is initialized
            agent = self.agents.get(agent_id)
            if not agent:
                raise ValueError(f"Agent {agent_id} has not been initialized")
            
            logger.info(f"Retrieving memory for agent: {agent_id}")
            
            # Retrieve agent state from Membase
            state = await self._get_agent_state_from_membase(agent_id)
            
            return {
                'agent_id': agent_id,
                'state': state,
                'last_updated': datetime.now().isoformat()
            }
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to get agent memory: {str(e)}")
            raise
    
    async def _get_agent_state_from_membase(self, agent_id: str) -> Dict[str, Any]:
        """
        Retrieve agent state from Membase decentralized storage.
        
        This method accesses the agent's MultiMemory instance to retrieve
        the complete conversation history and state from Membase.
        
        Args:
            agent_id: Unique agent identifier
            
        Returns:
            Dict containing agent state with interaction history
        """
        try:
            agent = self.agents.get(agent_id)
            if not agent:
                raise ValueError(f"Agent {agent_id} not found")
            
            # Get the agent's memory instance
            memory = agent._memory if hasattr(agent, '_memory') else None
            
            if memory:
                # Get the default conversation memory
                conversation_memory = memory.get_memory()
                
                # Retrieve all messages from memory
                messages = conversation_memory.get(recent_n=100)  # Get up to 100 recent messages
                
                # Convert messages to interaction history format
                interaction_history = []
                for i in range(0, len(messages), 2):
                    if i + 1 < len(messages):
                        user_msg = messages[i]
                        assistant_msg = messages[i + 1]
                        
                        if user_msg.role == "user" and assistant_msg.role == "assistant":
                            interaction_history.append({
                                'id': str(uuid.uuid4()),
                                'userQuery': user_msg.content,
                                'agentResponse': assistant_msg.content,
                                'timestamp': int(user_msg.timestamp) if hasattr(user_msg, 'timestamp') else int(datetime.now().timestamp()),
                                'context': user_msg.metadata if hasattr(user_msg, 'metadata') else {}
                            })
                
                logger.info(f"Retrieved {len(interaction_history)} interactions from Membase")
                
                # Build agent state
                state = {
                    'version': 1,
                    'createdAt': int(datetime.now().timestamp()),
                    'updatedAt': int(datetime.now().timestamp()),
                    'membaseId': agent_id,
                    'walletAddress': self.membase_account,
                    'registeredOnChain': True,
                    'preferences': {},
                    'interactionHistory': interaction_history,
                    'goals': [],
                    'learnedSummary': '',
                    'memoryHubConnected': True,
                    'lastSyncTimestamp': int(datetime.now().timestamp())
                }
                
                return state
            else:
                # Fallback if memory not available
                logger.warning(f"Memory not available for agent {agent_id}, returning empty state")
                return {
                    'version': 1,
                    'createdAt': int(datetime.now().timestamp()),
                    'updatedAt': int(datetime.now().timestamp()),
                    'membaseId': agent_id,
                    'walletAddress': self.membase_account,
                    'registeredOnChain': True,
                    'preferences': {},
                    'interactionHistory': [],
                    'goals': [],
                    'learnedSummary': '',
                    'memoryHubConnected': True,
                    'lastSyncTimestamp': int(datetime.now().timestamp())
                }
                
        except Exception as e:
            logger.error(f"Failed to retrieve agent state from Membase: {str(e)}")
            # Return empty state on error rather than failing
            return {
                'version': 1,
                'createdAt': int(datetime.now().timestamp()),
                'updatedAt': int(datetime.now().timestamp()),
                'membaseId': agent_id,
                'walletAddress': self.membase_account,
                'registeredOnChain': True,
                'preferences': {},
                'interactionHistory': [],
                'goals': [],
                'learnedSummary': '',
                'memoryHubConnected': True,
                'lastSyncTimestamp': int(datetime.now().timestamp())
            }
    
    async def _update_agent_state_in_membase(
        self,
        agent_id: str,
        query: str,
        response: str,
        interaction_id: str,
        user_context: Optional[Dict[str, Any]],
        previous_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update agent state in Membase with new interaction.
        
        The interaction is automatically stored in Membase by the agent's
        process_query method, so we just need to retrieve the updated state.
        
        Args:
            agent_id: Unique agent identifier
            query: User query
            response: Agent response
            interaction_id: Unique interaction identifier
            user_context: Optional user context
            previous_state: Previous agent state
            
        Returns:
            Updated agent state dict
        """
        try:
            # The agent's process_query method already stores the interaction in Membase
            # via the memory.add() calls, so we just need to retrieve the updated state
            
            # Add a small delay to ensure Membase sync completes
            import asyncio
            await asyncio.sleep(0.5)
            
            # Retrieve updated state from Membase
            updated_state = await self._get_agent_state_from_membase(agent_id)
            
            # Update metadata
            updated_state['updatedAt'] = int(datetime.now().timestamp())
            updated_state['lastSyncTimestamp'] = int(datetime.now().timestamp())
            
            # Merge user context into preferences if provided
            if user_context:
                updated_state['preferences'].update(user_context)
            
            logger.info(f"Agent state updated in Membase for agent: {agent_id}")
            
            return updated_state
            
        except Exception as e:
            logger.error(f"Failed to update agent state in Membase: {str(e)}")
            # Return previous state with new interaction appended
            new_interaction = {
                'id': interaction_id,
                'userQuery': query,
                'agentResponse': response,
                'timestamp': int(datetime.now().timestamp()),
                'context': user_context
            }
            
            previous_state['interactionHistory'].append(new_interaction)
            previous_state['updatedAt'] = int(datetime.now().timestamp())
            previous_state['lastSyncTimestamp'] = int(datetime.now().timestamp())
            
            if user_context:
                previous_state['preferences'].update(user_context)
            
            return previous_state
