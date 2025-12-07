"""
Integration tests for the /agent/register endpoint.

Tests verify the Flask endpoint properly handles registration requests
and returns appropriate responses and error codes.
"""

import pytest
import os
import json
from unittest.mock import patch, AsyncMock

# Set test environment variables before importing app
os.environ['MEMBASE_ACCOUNT'] = '0x1234567890abcdef1234567890abcdef12345678'
os.environ['MEMBASE_SECRET_KEY'] = 'test_secret_key'
os.environ['MEMBASE_ID'] = 'test_agent_001'
os.environ['MEMORY_HUB_ADDRESS'] = '54.169.29.193:8081'

# Mock MEMBASE_AVAILABLE to prevent real blockchain connections
import agent_manager as am_module
am_module.MEMBASE_AVAILABLE = False

from app import app
from agent_manager import BlockchainError


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestRegisterEndpoint:
    """Test suite for POST /agent/register endpoint."""
    
    @pytest.mark.asyncio
    async def test_register_success(self, client):
        """Test successful agent registration."""
        response = client.post(
            '/agent/register',
            data=json.dumps({'agent_id': 'test_agent_success'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        assert data['agent_id'] == 'test_agent_success'
        assert data['transaction_hash'].startswith('0x')
        assert len(data['transaction_hash']) == 66
        assert 'wallet_address' in data
    
    @pytest.mark.asyncio
    async def test_register_invalid_request(self, client):
        """Test registration with invalid request data."""
        response = client.post(
            '/agent/register',
            data=json.dumps({}),  # Missing agent_id
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        
        assert data['success'] is False
        assert 'error' in data
        assert data['error']['code'] == 'INVALID_REQUEST'
    
    @pytest.mark.asyncio
    async def test_register_already_registered_different_wallet(self, client):
        """Test registration when agent is already registered by another wallet."""
        # Mock the agent_manager to simulate already registered error
        with patch('app.agent_manager') as mock_manager:
            mock_manager.register_agent = AsyncMock(
                side_effect=BlockchainError(
                    "Agent 'test_agent' is already registered by another wallet: 0xabcdef..."
                )
            )
            
            response = client.post(
                '/agent/register',
                data=json.dumps({'agent_id': 'test_agent'}),
                content_type='application/json'
            )
            
            assert response.status_code == 409  # Conflict
            data = json.loads(response.data)
            
            assert data['success'] is False
            assert data['error']['code'] == 'AGENT_ALREADY_REGISTERED'
            assert 'already registered' in data['error']['message'].lower()
    
    @pytest.mark.asyncio
    async def test_register_insufficient_funds(self, client):
        """Test registration when wallet has insufficient BNB for gas."""
        with patch('app.agent_manager') as mock_manager:
            mock_manager.register_agent = AsyncMock(
                side_effect=BlockchainError(
                    "Insufficient BNB for gas fees. Please add BNB to wallet 0x1234567890abcdef1234567890abcdef12345678"
                )
            )
            
            response = client.post(
                '/agent/register',
                data=json.dumps({'agent_id': 'test_agent'}),
                content_type='application/json'
            )
            
            assert response.status_code == 402  # Payment Required
            data = json.loads(response.data)
            
            assert data['success'] is False
            assert data['error']['code'] == 'INSUFFICIENT_FUNDS'
            assert 'insufficient' in data['error']['message'].lower()
            assert 'bnb' in data['error']['message'].lower()
    
    @pytest.mark.asyncio
    async def test_register_blockchain_error(self, client):
        """Test registration with generic blockchain error."""
        with patch('app.agent_manager') as mock_manager:
            mock_manager.register_agent = AsyncMock(
                side_effect=BlockchainError("Transaction reverted: execution failed")
            )
            
            response = client.post(
                '/agent/register',
                data=json.dumps({'agent_id': 'test_agent'}),
                content_type='application/json'
            )
            
            assert response.status_code == 503  # Service Unavailable
            data = json.loads(response.data)
            
            assert data['success'] is False
            assert data['error']['code'] == 'BLOCKCHAIN_ERROR'
            assert data['error']['retryable'] is True
    
    @pytest.mark.asyncio
    async def test_register_transaction_hash_format(self, client):
        """Test that returned transaction hash has correct format."""
        response = client.post(
            '/agent/register',
            data=json.dumps({'agent_id': 'test_hash_format'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        tx_hash = data['transaction_hash']
        
        # Verify format
        assert tx_hash.startswith('0x')
        assert len(tx_hash) == 66
        
        # Verify it's valid hex
        try:
            int(tx_hash, 16)
        except ValueError:
            pytest.fail(f"Transaction hash is not valid hex: {tx_hash}")
    
    @pytest.mark.asyncio
    async def test_register_response_structure(self, client):
        """Test that response has all required fields."""
        response = client.post(
            '/agent/register',
            data=json.dumps({'agent_id': 'test_structure'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify all required fields are present
        required_fields = ['success', 'transaction_hash', 'agent_id', 'wallet_address']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify field types
        assert isinstance(data['success'], bool)
        assert isinstance(data['transaction_hash'], str)
        assert isinstance(data['agent_id'], str)
        assert isinstance(data['wallet_address'], str)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
