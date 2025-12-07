"""
Unit tests for AIP Agent Manager.

Tests cover agent registration, initialization, query processing,
and error handling.
"""

import pytest
import os
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

# Set test environment variables before importing agent_manager
os.environ['MEMBASE_ACCOUNT'] = '0x1234567890abcdef1234567890abcdef12345678'
os.environ['MEMBASE_SECRET_KEY'] = 'test_secret_key'
os.environ['MEMBASE_ID'] = 'test_agent_001'
os.environ['MEMORY_HUB_ADDRESS'] = '54.169.29.193:8081'

# Mock MEMBASE_AVAILABLE to prevent real blockchain connections in tests
import sys
import agent_manager as am_module
am_module.MEMBASE_AVAILABLE = False

from agent_manager import (
    AIPAgentManager,
    ConfigurationError,
    BlockchainError,
    AgentInitializationError,
    QueryProcessingError
)


class TestAIPAgentManager:
    """Test suite for AIPAgentManager class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.manager = AIPAgentManager()
    
    def test_initialization_success(self):
        """Test successful manager initialization."""
        assert self.manager.membase_account == '0x1234567890abcdef1234567890abcdef12345678'
        assert self.manager.membase_id == 'test_agent_001'
        assert self.manager.memory_hub_address == '54.169.29.193:8081'
        assert isinstance(self.manager.agents, dict)
    
    def test_configuration_validation_missing_account(self):
        """Test configuration validation fails with missing MEMBASE_ACCOUNT."""
        with patch.dict(os.environ, {'MEMBASE_ACCOUNT': ''}, clear=False):
            with pytest.raises(ConfigurationError) as exc_info:
                AIPAgentManager()
            assert "MEMBASE_ACCOUNT not set" in str(exc_info.value)
    
    def test_configuration_validation_invalid_address(self):
        """Test configuration validation fails with invalid wallet address."""
        with patch.dict(os.environ, {'MEMBASE_ACCOUNT': 'invalid_address'}, clear=False):
            with pytest.raises(ConfigurationError) as exc_info:
                AIPAgentManager()
            assert "valid BNB Chain address" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_register_agent_success(self):
        """Test successful agent registration."""
        result = await self.manager.register_agent('test_agent_001')
        
        assert result['agent_id'] == 'test_agent_001'
        assert result['wallet_address'] == '0x1234567890abcdef1234567890abcdef12345678'
        assert 'transaction_hash' in result
        assert result['transaction_hash'].startswith('0x')
    
    @pytest.mark.asyncio
    async def test_initialize_agent_success(self):
        """Test successful agent initialization."""
        result = await self.manager.initialize_agent(
            'test_agent_001',
            'Test agent description',
            '54.169.29.193:8081'
        )
        
        assert result['agent_id'] == 'test_agent_001'
        assert result['status'] == 'initialized'
        assert 'test_agent_001' in self.manager.agents
    
    @pytest.mark.asyncio
    async def test_initialize_agent_idempotent(self):
        """Test agent initialization is idempotent."""
        # Initialize once
        await self.manager.initialize_agent(
            'test_agent_002',
            'Test agent',
            '54.169.29.193:8081'
        )
        
        # Initialize again - should succeed
        result = await self.manager.initialize_agent(
            'test_agent_002',
            'Test agent',
            '54.169.29.193:8081'
        )
        
        assert result['status'] == 'initialized'
    
    @pytest.mark.asyncio
    async def test_query_agent_success(self):
        """Test successful agent query."""
        # Initialize agent first
        await self.manager.initialize_agent(
            'test_agent_003',
            'Test agent',
            '54.169.29.193:8081'
        )
        
        # Query agent
        result = await self.manager.query_agent(
            'test_agent_003',
            'What is the weather?',
            {'location': 'New York'}
        )
        
        assert 'response' in result
        assert 'agent_state' in result
        assert 'interaction_id' in result
        assert result['agent_state']['membaseId'] == 'test_agent_003'
    
    @pytest.mark.asyncio
    async def test_query_agent_not_initialized(self):
        """Test query fails when agent not initialized."""
        with pytest.raises(ValueError) as exc_info:
            await self.manager.query_agent(
                'nonexistent_agent',
                'Test query'
            )
        assert "has not been initialized" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_get_agent_status(self):
        """Test getting agent status."""
        # Initialize agent
        await self.manager.initialize_agent(
            'test_agent_004',
            'Test agent',
            '54.169.29.193:8081'
        )
        
        # Get status
        result = await self.manager.get_agent_status('test_agent_004')
        
        assert result['agent_id'] == 'test_agent_004'
        assert result['status'] == 'active'
        assert result['registered'] is True
        assert result['memory_hub_connected'] is True
    
    @pytest.mark.asyncio
    async def test_get_agent_memory_success(self):
        """Test getting agent memory."""
        # Initialize agent
        await self.manager.initialize_agent(
            'test_agent_005',
            'Test agent',
            '54.169.29.193:8081'
        )
        
        # Get memory
        result = await self.manager.get_agent_memory('test_agent_005')
        
        assert result['agent_id'] == 'test_agent_005'
        assert 'state' in result
        assert 'last_updated' in result
        assert result['state']['membaseId'] == 'test_agent_005'
    
    @pytest.mark.asyncio
    async def test_get_agent_memory_not_initialized(self):
        """Test getting memory fails when agent not initialized."""
        with pytest.raises(ValueError) as exc_info:
            await self.manager.get_agent_memory('nonexistent_agent')
        assert "has not been initialized" in str(exc_info.value)


class TestConfigurationValidation:
    """Test suite for configuration validation."""
    
    def test_valid_wallet_address(self):
        """Test valid wallet address passes validation."""
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0xabcdef1234567890abcdef1234567890abcdef12',
            'MEMBASE_SECRET_KEY': 'test_key',
            'MEMBASE_ID': 'test_agent',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            manager = AIPAgentManager()
            assert manager.membase_account == '0xabcdef1234567890abcdef1234567890abcdef12'
    
    def test_invalid_wallet_address_no_prefix(self):
        """Test wallet address without 0x prefix fails."""
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': 'abcdef1234567890abcdef1234567890abcdef12',
            'MEMBASE_SECRET_KEY': 'test_key',
            'MEMBASE_ID': 'test_agent'
        }):
            with pytest.raises(ConfigurationError):
                AIPAgentManager()
    
    def test_invalid_wallet_address_wrong_length(self):
        """Test wallet address with wrong length fails."""
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0xabcdef',
            'MEMBASE_SECRET_KEY': 'test_key',
            'MEMBASE_ID': 'test_agent'
        }):
            with pytest.raises(ConfigurationError):
                AIPAgentManager()


class TestConnectionLogging:
    """
    Property-Based Test for connection logging.
    
    **Feature: bitagent-unibase-integration, Property 11: Connection logging**
    
    Property: For any successful blockchain connection, the Python service 
    should emit a log entry containing the RPC endpoint and connection status.
    
    **Validates: Requirements 5.4, 5.5**
    """
    
    @pytest.mark.parametrize('network,expected_rpc', [
        ('bsc-testnet', 'https://bsc-testnet-rpc.publicnode.com'),
        ('bsc-mainnet', 'https://bsc-dataseed.binance.org'),
    ])
    def test_connection_logging_property(self, network, expected_rpc, caplog):
        """
        Property test: Connection logging for any network configuration.
        
        For any valid network configuration (testnet or mainnet), when the
        Membase client is initialized, the logs should contain:
        1. The RPC endpoint being used
        2. The connection status
        3. The contract address
        4. The wallet address
        
        This property ensures that connection information is always logged
        for debugging and verification purposes.
        """
        import logging
        caplog.set_level(logging.INFO)
        
        # Mock the Membase Client to avoid real blockchain connections in tests
        with patch('agent_manager.MEMBASE_AVAILABLE', False):
            with patch.dict(os.environ, {
                'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
                'MEMBASE_SECRET_KEY': 'test_secret_key',
                'MEMBASE_ID': 'test_agent_001',
                'MEMORY_HUB_ADDRESS': '54.169.29.193:8081',
                'MEMBASE_NETWORK': network
            }):
                # Initialize manager (which initializes Membase client)
                manager = AIPAgentManager()
                
                # Verify logs contain required information
                log_text = caplog.text
                
                # Property 1: RPC endpoint must be logged
                assert expected_rpc in log_text, \
                    f"RPC endpoint {expected_rpc} not found in logs for network {network}"
                
                # Property 2: Connection status must be logged
                assert 'Connection status' in log_text or 'connection' in log_text.lower(), \
                    "Connection status not logged"
                
                # Property 3: Contract address must be logged
                assert '0x100E3F8c5285df46A8B9edF6b38B8f90F1C32B7b' in log_text, \
                    "Membase contract address not logged"
                
                # Property 4: Wallet address must be logged
                assert '0x1234567890abcdef1234567890abcdef12345678' in log_text, \
                    "Wallet address not logged"
                
                # Property 5: Network must be logged
                assert network in log_text, \
                    f"Network {network} not logged"
    
    def test_connection_logging_on_error(self, caplog):
        """
        Property test: Connection errors are logged with details.
        
        For any connection failure, the error should be logged with
        sufficient detail to diagnose the issue.
        """
        import logging
        caplog.set_level(logging.INFO)  # Changed to INFO to capture config validation logs
        
        # Use invalid credentials to trigger connection error
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x0000000000000000000000000000000000000000',
            'MEMBASE_SECRET_KEY': '',  # Empty secret key
            'MEMBASE_ID': 'test_agent',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            with pytest.raises(ConfigurationError):
                AIPAgentManager()
            
            # Verify error was logged
            log_text = caplog.text
            assert 'MEMBASE_SECRET_KEY' in log_text or 'secret' in log_text.lower(), \
                "Configuration error not properly logged"
    
    def test_successful_connection_always_logs_status(self, caplog):
        """
        Property test: Every successful initialization logs connection status.
        
        For any valid configuration, the initialization should always
        log a success message with connection status.
        """
        import logging
        caplog.set_level(logging.INFO)
        
        # Mock the Membase Client to avoid real blockchain connections
        with patch('agent_manager.MEMBASE_AVAILABLE', False):
            with patch.dict(os.environ, {
                'MEMBASE_ACCOUNT': '0xabcdef1234567890abcdef1234567890abcdef12',
                'MEMBASE_SECRET_KEY': 'valid_secret_key',
                'MEMBASE_ID': 'test_agent_999',
                'MEMORY_HUB_ADDRESS': 'localhost:8081',
                'MEMBASE_NETWORK': 'bsc-testnet'
            }):
                manager = AIPAgentManager()
                
                log_text = caplog.text
                
                # Property: Success message must be present
                assert 'initialized successfully' in log_text.lower() or \
                       'Connection status' in log_text, \
                    "Success message not logged for valid configuration"
                
                # Property: Must indicate connection was established
                assert 'Connected' in log_text or 'connection' in log_text.lower(), \
                    "Connection establishment not indicated in logs"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
