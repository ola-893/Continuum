"""
Property-based tests for configuration validation.

These tests use Hypothesis to verify that configuration validation
behaves correctly across a wide range of inputs.

Feature: bitagent-unibase-integration
"""

import pytest
import os
from unittest.mock import patch
from hypothesis import given, strategies as st, settings, assume

from app import validate_config, ConfigurationError
from agent_manager import AIPAgentManager


# Custom strategies for generating test data
@st.composite
def valid_hex_string(draw, length=40):
    """Generate a valid hexadecimal string of specified length."""
    hex_chars = '0123456789abcdefABCDEF'
    return ''.join(draw(st.sampled_from(hex_chars)) for _ in range(length))


@st.composite
def valid_bnb_address(draw):
    """Generate a valid BNB Chain address (0x + 40 hex chars)."""
    hex_part = draw(valid_hex_string(40))
    return f"0x{hex_part}"


@st.composite
def invalid_bnb_address(draw):
    """Generate an invalid BNB Chain address."""
    choice = draw(st.integers(min_value=0, max_value=3))
    
    if choice == 0:
        # Missing 0x prefix
        return draw(valid_hex_string(40))
    elif choice == 1:
        # Wrong length (too short)
        hex_part = draw(valid_hex_string(draw(st.integers(min_value=1, max_value=39))))
        return f"0x{hex_part}"
    elif choice == 2:
        # Wrong length (too long)
        hex_part = draw(valid_hex_string(draw(st.integers(min_value=41, max_value=100))))
        return f"0x{hex_part}"
    else:
        # Contains non-hex characters
        length = 40
        result = []
        for _ in range(length):
            if draw(st.booleans()):
                result.append(draw(st.sampled_from('0123456789abcdef')))
            else:
                result.append(draw(st.sampled_from('ghijklmnopqrstuvwxyz')))
        return f"0x{''.join(result)}"


@st.composite
def valid_host_port(draw):
    """Generate a valid host:port string."""
    # Generate host (simple alphanumeric or IP address)
    host_type = draw(st.integers(min_value=0, max_value=1))
    if host_type == 0:
        # IP address
        octets = [str(draw(st.integers(min_value=0, max_value=255))) for _ in range(4)]
        host = '.'.join(octets)
    else:
        # Hostname
        host = draw(st.text(alphabet=st.characters(whitelist_categories=('Ll', 'Lu', 'Nd'), whitelist_characters='.-'), min_size=1, max_size=50))
        assume(host.strip() != '')
    
    # Generate port
    port = draw(st.integers(min_value=1, max_value=65535))
    
    return f"{host}:{port}"


@st.composite
def invalid_host_port(draw):
    """Generate an invalid host:port string."""
    choice = draw(st.integers(min_value=0, max_value=3))
    
    if choice == 0:
        # Missing colon
        return draw(st.text(alphabet=st.characters(blacklist_characters='\x00:'), min_size=1, max_size=50))
    elif choice == 1:
        # Empty host
        port = draw(st.integers(min_value=1, max_value=65535))
        return f":{port}"
    elif choice == 2:
        # Invalid port (out of range)
        host = draw(st.text(alphabet=st.characters(blacklist_characters='\x00:'), min_size=1, max_size=20))
        port = draw(st.integers(min_value=65536, max_value=100000))
        return f"{host}:{port}"
    else:
        # Non-numeric port
        host = draw(st.text(alphabet=st.characters(blacklist_characters='\x00:'), min_size=1, max_size=20))
        port = draw(st.text(alphabet=st.characters(whitelist_categories=('Ll', 'Lu'), blacklist_characters='\x00'), min_size=1, max_size=10))
        return f"{host}:{port}"


class TestWalletAddressValidation:
    """
    Property-based tests for wallet address validation.
    
    **Feature: bitagent-unibase-integration, Property 8: Wallet address validation**
    **Validates: Requirements 5.1**
    """
    
    @given(valid_bnb_address())
    @settings(max_examples=100)
    def test_valid_wallet_addresses_pass_validation(self, address):
        """
        Property: For any valid BNB Chain address (0x + 40 hex chars),
        the validation should succeed without raising an error.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': address,
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            # Should not raise an exception
            validate_config()
    
    @given(invalid_bnb_address())
    @settings(max_examples=100)
    def test_invalid_wallet_addresses_fail_validation(self, address):
        """
        Property: For any invalid BNB Chain address (wrong format),
        the validation should raise a ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': address,
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            # Error message should mention MEMBASE_ACCOUNT
            assert 'MEMBASE_ACCOUNT' in str(exc_info.value)
    
    @given(st.one_of(
        st.just(''),
        st.text(alphabet=' \t\n\r', min_size=1, max_size=20)
    ))
    @settings(max_examples=100)
    def test_empty_or_whitespace_wallet_address_fails(self, address):
        """
        Property: For any empty or whitespace-only string,
        the validation should raise a ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': address,
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMBASE_ACCOUNT' in str(exc_info.value)


class TestEnvironmentVariableValidation:
    """
    Property-based tests for environment variable validation.
    
    **Feature: bitagent-unibase-integration, Property 4: Environment variable validation**
    **Validates: Requirements 5.1, 5.2, 5.3**
    """
    
    @given(
        st.text(alphabet=st.characters(blacklist_characters='\x00'), min_size=1, max_size=100).filter(lambda x: x.strip() != ''),
        st.text(alphabet=st.characters(blacklist_characters='\x00'), min_size=1, max_size=100).filter(lambda x: x.strip() != '')
    )
    @settings(max_examples=100)
    def test_non_empty_secret_key_and_id_pass_validation(self, secret_key, agent_id):
        """
        Property: For any non-empty MEMBASE_SECRET_KEY and MEMBASE_ID,
        if other variables are valid, validation should succeed.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_SECRET_KEY': secret_key,
            'MEMBASE_ID': agent_id,
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            # Should not raise an exception
            validate_config()
    
    @given(st.one_of(
        st.just(''),
        st.text(alphabet=' \t\n\r', min_size=1, max_size=20)
    ))
    @settings(max_examples=100)
    def test_empty_secret_key_fails_validation(self, secret_key):
        """
        Property: For any empty or whitespace-only MEMBASE_SECRET_KEY,
        validation should raise a ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_SECRET_KEY': secret_key,
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMBASE_SECRET_KEY' in str(exc_info.value)
    
    @given(st.one_of(
        st.just(''),
        st.text(alphabet=' \t\n\r', min_size=1, max_size=20)
    ))
    @settings(max_examples=100)
    def test_empty_agent_id_fails_validation(self, agent_id):
        """
        Property: For any empty or whitespace-only MEMBASE_ID,
        validation should raise a ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': agent_id,
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMBASE_ID' in str(exc_info.value)
    
    @given(valid_host_port())
    @settings(max_examples=100)
    def test_valid_memory_hub_address_passes_validation(self, hub_address):
        """
        Property: For any valid host:port format MEMORY_HUB_ADDRESS,
        validation should succeed.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': hub_address
        }):
            # Should not raise an exception
            validate_config()
    
    @given(invalid_host_port())
    @settings(max_examples=100)
    def test_invalid_memory_hub_address_fails_validation(self, hub_address):
        """
        Property: For any invalid host:port format MEMORY_HUB_ADDRESS,
        validation should raise a ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': hub_address
        }):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMORY_HUB_ADDRESS' in str(exc_info.value)
    
    def test_missing_membase_account_fails(self):
        """
        Test that missing MEMBASE_ACCOUNT raises ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMBASE_ACCOUNT' in str(exc_info.value)
    
    def test_missing_membase_secret_key_fails(self):
        """
        Test that missing MEMBASE_SECRET_KEY raises ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_ID': 'test_agent_001',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMBASE_SECRET_KEY' in str(exc_info.value)
    
    def test_missing_membase_id_fails(self):
        """
        Test that missing MEMBASE_ID raises ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMORY_HUB_ADDRESS': '54.169.29.193:8081'
        }, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMBASE_ID' in str(exc_info.value)
    
    def test_missing_memory_hub_address_fails(self):
        """
        Test that missing MEMORY_HUB_ADDRESS raises ConfigurationError.
        """
        with patch.dict(os.environ, {
            'MEMBASE_ACCOUNT': '0x1234567890abcdef1234567890abcdef12345678',
            'MEMBASE_SECRET_KEY': 'test_secret_key',
            'MEMBASE_ID': 'test_agent_001'
        }, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                validate_config()
            assert 'MEMORY_HUB_ADDRESS' in str(exc_info.value)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
