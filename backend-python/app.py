"""
Flask application entry point for AIP Agent microservice.

This service wraps the AIP Agent SDK and exposes REST endpoints
for the Node.js backend to interact with on-chain AI agents.
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from agent_manager import AIPAgentManager, BlockchainError
from models import (
    RegisterRequest,
    RegisterResponse,
    InitializeRequest,
    InitializeResponse,
    QueryRequest,
    QueryResponse,
    AgentStatus,
    AgentMemory,
    ErrorResponse
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize agent manager
agent_manager = None


class ConfigurationError(Exception):
    """Raised when environment variables are missing or invalid."""
    pass


def validate_config():
    """
    Validate required environment variables.
    
    Validates:
    - MEMBASE_ACCOUNT: Valid BNB Chain address (0x + 40 hex chars)
    - MEMBASE_SECRET_KEY: Non-empty string
    - MEMBASE_ID: Non-empty string
    - MEMORY_HUB_ADDRESS: Format host:port
    
    Raises:
        ConfigurationError: If any validation fails with clear message
    """
    errors = []
    
    # Validate MEMBASE_ACCOUNT
    membase_account = os.getenv('MEMBASE_ACCOUNT')
    if not membase_account:
        errors.append("MEMBASE_ACCOUNT is required but not set. Please configure your BNB Chain wallet address.")
    elif not membase_account.startswith('0x'):
        errors.append(f"MEMBASE_ACCOUNT must start with '0x', got: {membase_account}")
    elif len(membase_account) != 42:
        errors.append(f"MEMBASE_ACCOUNT must be 42 characters (0x + 40 hex chars), got length: {len(membase_account)}")
    else:
        # Validate hex characters
        try:
            int(membase_account[2:], 16)
        except ValueError:
            errors.append(f"MEMBASE_ACCOUNT must contain only hexadecimal characters after '0x'")
    
    # Validate MEMBASE_SECRET_KEY
    membase_secret = os.getenv('MEMBASE_SECRET_KEY')
    if not membase_secret:
        errors.append("MEMBASE_SECRET_KEY is required but not set. Please configure your wallet private key.")
    elif not membase_secret.strip():
        errors.append("MEMBASE_SECRET_KEY cannot be empty or whitespace only.")
    
    # Validate MEMBASE_ID
    membase_id = os.getenv('MEMBASE_ID')
    if not membase_id:
        errors.append("MEMBASE_ID is required but not set. Please configure your agent identifier.")
    elif not membase_id.strip():
        errors.append("MEMBASE_ID cannot be empty or whitespace only.")
    
    # Validate MEMORY_HUB_ADDRESS
    memory_hub = os.getenv('MEMORY_HUB_ADDRESS')
    if not memory_hub:
        errors.append("MEMORY_HUB_ADDRESS is required but not set. Please configure the Memory Hub address.")
    elif not memory_hub.strip():
        errors.append("MEMORY_HUB_ADDRESS cannot be empty or whitespace only.")
    else:
        # Validate host:port format
        if ':' not in memory_hub:
            errors.append(f"MEMORY_HUB_ADDRESS must have format 'host:port', got: {memory_hub}")
        else:
            parts = memory_hub.split(':')
            if len(parts) != 2:
                errors.append(f"MEMORY_HUB_ADDRESS must have format 'host:port', got: {memory_hub}")
            else:
                host, port = parts
                if not host.strip():
                    errors.append(f"MEMORY_HUB_ADDRESS host cannot be empty")
                try:
                    port_num = int(port)
                    if port_num < 1 or port_num > 65535:
                        errors.append(f"MEMORY_HUB_ADDRESS port must be between 1 and 65535, got: {port_num}")
                except ValueError:
                    errors.append(f"MEMORY_HUB_ADDRESS port must be a valid number, got: {port}")
    
    if errors:
        error_msg = "Configuration validation failed:\n" + "\n".join(f"  - {err}" for err in errors)
        logger.error(error_msg)
        raise ConfigurationError(error_msg)
    
    # Log successful configuration (mask sensitive values)
    logger.info("Configuration validated successfully")
    logger.info(f"MEMBASE_ACCOUNT: {membase_account}")
    logger.info(f"MEMBASE_ID: {membase_id}")
    logger.info(f"MEMORY_HUB_ADDRESS: {memory_hub}")
    logger.info(f"MEMBASE_SECRET_KEY: {'*' * 10} (masked)")


@app.before_request
def initialize_agent_manager():
    """Initialize agent manager on first request."""
    global agent_manager
    if agent_manager is None:
        try:
            validate_config()
            agent_manager = AIPAgentManager()
            logger.info("Agent manager initialized successfully")
        except ConfigurationError as e:
            logger.error(f"Configuration error: {str(e)}")
            return jsonify(ErrorResponse(
                success=False,
                error={
                    "code": "CONFIG_MISSING",
                    "message": str(e),
                    "retryable": False
                }
            ).model_dump()), 500
        except Exception as e:
            logger.error(f"Failed to initialize agent manager: {str(e)}")
            return jsonify(ErrorResponse(
                success=False,
                error={
                    "code": "INITIALIZATION_ERROR",
                    "message": str(e),
                    "retryable": False
                }
            ).model_dump()), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "aip-agent-microservice"}), 200


def _run_async(coro):
    """Helper to run async functions in sync context."""
    import asyncio
    try:
        # Try to get existing loop
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No running loop, use asyncio.run
        return asyncio.run(coro)
    else:
        # Loop is running, we need nest_asyncio or create task
        try:
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(coro)
        except ImportError:
            # nest_asyncio not available, use thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, coro)
                return future.result()


@app.route('/agent/register', methods=['POST'])
def register_agent():
    """
    Register agent on-chain via Membase smart contract.
    
    Handles:
    - Agent already registered by another wallet (409 Conflict)
    - Insufficient funds for gas fees (402 Payment Required)
    - Blockchain transaction errors (503 Service Unavailable)
    - Invalid request data (400 Bad Request)
    """
    try:
        data = request.get_json()
        req = RegisterRequest(**data)
        
        logger.info(f"Registering agent: {req.agent_id}")
        
        # Run async function
        result = _run_async(agent_manager.register_agent(req.agent_id))
        
        response = RegisterResponse(
            success=True,
            transaction_hash=result['transaction_hash'],
            agent_id=result['agent_id'],
            wallet_address=result['wallet_address']
        )
        
        logger.info(f"Agent registered successfully: {result['transaction_hash']}")
        return jsonify(response.model_dump()), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "INVALID_REQUEST",
                "message": str(e),
                "retryable": False
            }
        ).model_dump()), 400
    except BlockchainError as e:
        error_msg = str(e)
        
        # Handle "already registered" error
        if "already registered by another wallet" in error_msg:
            logger.error(f"Agent already registered: {error_msg}")
            return jsonify(ErrorResponse(
                success=False,
                error={
                    "code": "AGENT_ALREADY_REGISTERED",
                    "message": error_msg,
                    "retryable": False
                }
            ).model_dump()), 409
        
        # Handle "insufficient funds" error
        if "insufficient" in error_msg.lower() and ("bnb" in error_msg.lower() or "funds" in error_msg.lower()):
            logger.error(f"Insufficient funds: {error_msg}")
            return jsonify(ErrorResponse(
                success=False,
                error={
                    "code": "INSUFFICIENT_FUNDS",
                    "message": error_msg,
                    "retryable": False
                }
            ).model_dump()), 402
        
        # Generic blockchain error
        logger.error(f"Blockchain error: {error_msg}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "BLOCKCHAIN_ERROR",
                "message": error_msg,
                "retryable": True
            }
        ).model_dump()), 503
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "INTERNAL_ERROR",
                "message": str(e),
                "retryable": True
            }
        ).model_dump()), 500


@app.route('/agent/initialize', methods=['POST'])
def initialize_agent():
    """Initialize AIP agent with Memory Hub connection."""
    try:
        data = request.get_json()
        req = InitializeRequest(**data)
        
        logger.info(f"Initializing agent: {req.agent_id}")
        
        # Run async function
        result = _run_async(agent_manager.initialize_agent(
            req.agent_id,
            req.description,
            req.memory_hub_address
        ))
        
        response = InitializeResponse(
            success=True,
            agent_id=result['agent_id'],
            status=result['status']
        )
        
        logger.info(f"Agent initialized successfully: {req.agent_id}")
        return jsonify(response.model_dump()), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "INVALID_REQUEST",
                "message": str(e),
                "retryable": False
            }
        ).model_dump()), 400
    except Exception as e:
        logger.error(f"Initialization failed: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "AGENT_INITIALIZATION_ERROR",
                "message": str(e),
                "retryable": True
            }
        ).model_dump()), 503


@app.route('/agent/query', methods=['POST'])
def query_agent():
    """Send query to agent and get response."""
    try:
        data = request.get_json()
        req = QueryRequest(**data)
        
        logger.info(f"Processing query for agent: {req.agent_id}")
        
        # Run async function
        result = _run_async(agent_manager.query_agent(
            req.agent_id,
            req.query,
            req.user_context
        ))
        
        response = QueryResponse(
            success=True,
            response=result['response'],
            agent_state=result['agent_state'],
            interaction_id=result['interaction_id']
        )
        
        logger.info(f"Query processed successfully for agent: {req.agent_id}")
        return jsonify(response.model_dump()), 200
        
    except ValueError as e:
        logger.error(f"Agent not found: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "AGENT_NOT_FOUND",
                "message": str(e),
                "details": {
                    "agent_id": req.agent_id,
                    "suggestion": "Call POST /agent/initialize first"
                },
                "retryable": False
            }
        ).model_dump()), 404
    except Exception as e:
        logger.error(f"Query processing failed: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "QUERY_PROCESSING_ERROR",
                "message": str(e),
                "retryable": True
            }
        ).model_dump()), 503


@app.route('/agent/status/<agent_id>', methods=['GET'])
def get_agent_status(agent_id: str):
    """Get agent status and metadata."""
    try:
        logger.info(f"Getting status for agent: {agent_id}")
        
        # Run async function
        result = _run_async(agent_manager.get_agent_status(agent_id))
        
        response = AgentStatus(
            agent_id=result['agent_id'],
            status=result['status'],
            registered=result['registered'],
            wallet_address=result['wallet_address'],
            memory_hub_connected=result['memory_hub_connected']
        )
        
        return jsonify(response.model_dump()), 200
        
    except Exception as e:
        logger.error(f"Failed to get agent status: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "AGENT_NOT_FOUND",
                "message": str(e),
                "retryable": False
            }
        ).model_dump()), 404


@app.route('/agent/memory/<agent_id>', methods=['GET'])
def get_agent_memory(agent_id: str):
    """Retrieve agent's decentralized memory."""
    try:
        logger.info(f"Getting memory for agent: {agent_id}")
        
        # Run async function
        result = _run_async(agent_manager.get_agent_memory(agent_id))
        
        response = AgentMemory(
            agent_id=result['agent_id'],
            state=result['state'],
            last_updated=result['last_updated']
        )
        
        return jsonify(response.model_dump()), 200
        
    except ValueError as e:
        logger.error(f"Agent not found: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "AGENT_NOT_FOUND",
                "message": str(e),
                "retryable": False
            }
        ).model_dump()), 404
    except Exception as e:
        logger.error(f"Failed to get agent memory: {str(e)}")
        return jsonify(ErrorResponse(
            success=False,
            error={
                "code": "MEMORY_RETRIEVAL_ERROR",
                "message": str(e),
                "retryable": True
            }
        ).model_dump()), 503


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify(ErrorResponse(
        success=False,
        error={
            "code": "NOT_FOUND",
            "message": "Endpoint not found",
            "retryable": False
        }
    ).model_dump()), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify(ErrorResponse(
        success=False,
        error={
            "code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "retryable": True
        }
    ).model_dump()), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting AIP Agent microservice on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
