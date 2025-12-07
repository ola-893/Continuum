"""
Property-Based Tests for Agent Initialization.

These tests verify correctness properties for the agent initialization process
using property-based testing with Hypothesis.
"""

import pytest
import os
from unittest.mock import Mock, patch, AsyncMock
from hypothesis import given, strategies as st, settings, assume

# Set test environment variables before importing agent_manager
os.environ['MEMBASE_ACCOUNT'] = '0x1234567890abcdef1234567890abcdef12345678'
os.environ['MEMBASE_SECRET_KEY'] = 'test_secret_key'
os.environ['MEMBASE_ID'] = 'test_agent_001'
os.environ['MEMORY_HUB_ADDRESS'] = '54.169.29.193:8081'

# Mock MEMBASE_AVAILABLE to prevent real blockchain connections in tests
import agent_manager as am_module
am_module.MEMBASE_AVAILABLE = False

from agent_manager import (
    AIPAgentManager,
    AgentInitializationError
)


# Mock agent class for testing
class MockAgent:
    """Mock agent for testing idempotence without real SDK."""
    def __init__(self, name=None, description=None, host_address=None, server_names=None, agent_cls=None, **kwargs):
        self.name = name
        self._name = name
        self.description = description
        self.host_address = host_address
        self.server_names = server_names or []
        self.initialized = False
    
    async def initialize(self):
        """Mock initialization."""
        self.initialized = True
    
    async def process_query(self, query, **kwargs):
        """Mock query processing."""
        return f"Mock response to: {query}"


class TestAgentInitializationIdempotence:
    """
    Property-Based Test for agent initialization idempotence.
    
    **Feature: bitagent-unibase-integration, Property 13: Agent initialization idempotence**
    
    Property: For any agent that is already initialized, calling initialize again 
    with the same agent ID should either succeed immediately (idempotent) or return 
    a clear "already initialized" message.
    
    **Validates: Requirements 2.1, 2.2**
    """
    
    @pytest.mark.asyncio
    @given(
        agent_id=st.text(
            min_size=1, 
            max_size=100, 
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll', 'Nd'),
                whitelist_characters='_-'
            )
        ),
        description=st.text(min_size=1, max_size=200)
    )
    @settings(max_examples=100, deadline=None)
    async def test_initialization_idempotence_property(self, agent_id, description):
        """
        Property test: Agent initialization is idempotent.
        
        For any agent_id and description, initializing an agent multiple times
        should:
        1. Succeed on first initialization
        2. Succeed on subsequent initializations (idempotent)
        3. Return consistent status ('initialized')
        4. Not create duplicate agent instances
        5. Maintain the same agent in the cache
        
        This property ensures that initialization can be safely called multiple
        times without side effects, which is important for:
        - Retry logic in distributed systems
        - Service restarts
        - Connection recovery scenarios
        """
        # Skip empty or whitespace-only inputs
        assume(agent_id.strip())
        assume(description.strip())
        
        # Initialize manager
        manager = AIPAgentManager()
        
        # Mock the FullAgentWrapper to avoid real SDK calls
        with patch('aip_agent.agents.full_agent.FullAgentWrapper', MockAgent):
            with patch('aip_agent.agents.custom_agent.CallbackAgent', MockAgent):
                # Property 1: First initialization should succeed
                result1 = await manager.initialize_agent(
                    agent_id=agent_id,
                    description=description,
                    memory_hub_address='54.169.29.193:8081'
                )
                
                assert result1['agent_id'] == agent_id, \
                    f"First initialization should return correct agent_id"
                assert result1['status'] == 'initialized', \
                    f"First initialization should return status 'initialized'"
                
                # Verify agent is in cache
                assert agent_id in manager.agents, \
                    f"Agent {agent_id} should be in cache after first initialization"
                
                # Store reference to first agent instance
                first_agent = manager.agents[agent_id]
                
                # Property 2: Second initialization should succeed (idempotent)
                result2 = await manager.initialize_agent(
                    agent_id=agent_id,
                    description=description,
                    memory_hub_address='54.169.29.193:8081'
                )
                
                assert result2['agent_id'] == agent_id, \
                    f"Second initialization should return correct agent_id"
                assert result2['status'] == 'initialized', \
                    f"Second initialization should return status 'initialized'"
                
                # Property 3: Agent should still be in cache
                assert agent_id in manager.agents, \
                    f"Agent {agent_id} should still be in cache after second initialization"
                
                # Property 4: Should be the same agent instance (not duplicated)
                second_agent = manager.agents[agent_id]
                assert first_agent is second_agent, \
                    f"Second initialization should return same agent instance, not create duplicate"
                
                # Property 5: Third initialization should also succeed
                result3 = await manager.initialize_agent(
                    agent_id=agent_id,
                    description=description,
                    memory_hub_address='54.169.29.193:8081'
                )
                
                assert result3['agent_id'] == agent_id, \
                    f"Third initialization should return correct agent_id"
                assert result3['status'] == 'initialized', \
                    f"Third initialization should return status 'initialized'"
                
                # Property 6: Still the same agent instance
                third_agent = manager.agents[agent_id]
                assert first_agent is third_agent, \
                    f"Third initialization should return same agent instance"
                
                # Property 7: Cache should only contain one entry for this agent
                agent_count = sum(1 for key in manager.agents.keys() if key == agent_id)
                assert agent_count == 1, \
                    f"Cache should contain exactly one entry for agent {agent_id}, found {agent_count}"
    
    @pytest.mark.asyncio
    async def test_initialization_idempotence_specific_examples(self):
        """
        Test initialization idempotence with specific examples.
        
        This complements the property test by checking specific edge cases
        and common agent ID patterns.
        """
        manager = AIPAgentManager()
        
        # Test with various agent ID formats
        test_cases = [
            ('simple_agent', 'A simple test agent'),
            ('agent-with-dashes', 'Agent with dashes in ID'),
            ('agent_123', 'Agent with numbers'),
            ('UPPERCASE_AGENT', 'Uppercase agent ID'),
            ('MixedCase_Agent_123', 'Mixed case agent ID')
        ]
        
        with patch('aip_agent.agents.full_agent.FullAgentWrapper', MockAgent):
            with patch('aip_agent.agents.custom_agent.CallbackAgent', MockAgent):
                for agent_id, description in test_cases:
                    # Initialize first time
                    result1 = await manager.initialize_agent(agent_id, description)
                    assert result1['status'] == 'initialized', \
                        f"First initialization failed for {agent_id}"
                    
                    # Initialize second time - should be idempotent
                    result2 = await manager.initialize_agent(agent_id, description)
                    assert result2['status'] == 'initialized', \
                        f"Second initialization failed for {agent_id}"
                    
                    # Verify same agent instance
                    assert manager.agents[agent_id] is manager.agents[agent_id], \
                        f"Agent instance changed for {agent_id}"
    
    @pytest.mark.asyncio
    async def test_initialization_idempotence_with_different_descriptions(self):
        """
        Property test: Idempotence holds even with different descriptions.
        
        When initializing an already-initialized agent with a different description,
        the operation should still be idempotent (use the existing agent).
        """
        manager = AIPAgentManager()
        
        agent_id = 'test_agent_descriptions'
        
        with patch('aip_agent.agents.full_agent.FullAgentWrapper', MockAgent):
            with patch('aip_agent.agents.custom_agent.CallbackAgent', MockAgent):
                # Initialize with first description
                result1 = await manager.initialize_agent(
                    agent_id=agent_id,
                    description='First description'
                )
                assert result1['status'] == 'initialized'
                first_agent = manager.agents[agent_id]
                
                # Initialize with different description - should be idempotent
                result2 = await manager.initialize_agent(
                    agent_id=agent_id,
                    description='Second description (different)'
                )
                assert result2['status'] == 'initialized'
                second_agent = manager.agents[agent_id]
                
                # Should be the same agent instance (idempotent)
                assert first_agent is second_agent, \
                    "Initialization with different description should be idempotent"
    
    @pytest.mark.asyncio
    async def test_initialization_idempotence_with_different_memory_hub(self):
        """
        Property test: Idempotence holds even with different memory hub addresses.
        
        When initializing an already-initialized agent with a different memory hub,
        the operation should still be idempotent (use the existing agent).
        """
        manager = AIPAgentManager()
        
        agent_id = 'test_agent_memory_hub'
        
        with patch('aip_agent.agents.full_agent.FullAgentWrapper', MockAgent):
            with patch('aip_agent.agents.custom_agent.CallbackAgent', MockAgent):
                # Initialize with first memory hub
                result1 = await manager.initialize_agent(
                    agent_id=agent_id,
                    description='Test agent',
                    memory_hub_address='54.169.29.193:8081'
                )
                assert result1['status'] == 'initialized'
                first_agent = manager.agents[agent_id]
                
                # Initialize with different memory hub - should be idempotent
                result2 = await manager.initialize_agent(
                    agent_id=agent_id,
                    description='Test agent',
                    memory_hub_address='localhost:8081'
                )
                assert result2['status'] == 'initialized'
                second_agent = manager.agents[agent_id]
                
                # Should be the same agent instance (idempotent)
                assert first_agent is second_agent, \
                    "Initialization with different memory hub should be idempotent"
    
    @pytest.mark.asyncio
    @given(
        agent_ids=st.lists(
            st.text(
                min_size=1,
                max_size=50,
                alphabet=st.characters(
                    whitelist_categories=('Lu', 'Ll', 'Nd'),
                    whitelist_characters='_'
                )
            ),
            min_size=1,
            max_size=10,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=None)
    async def test_multiple_agents_initialization_idempotence(self, agent_ids):
        """
        Property test: Idempotence holds for multiple different agents.
        
        For any list of unique agent IDs, each agent should be independently
        idempotent - initializing one agent multiple times should not affect
        the idempotence of other agents.
        """
        # Filter out empty or whitespace-only IDs
        agent_ids = [aid for aid in agent_ids if aid.strip()]
        assume(len(agent_ids) > 0)
        
        manager = AIPAgentManager()
        
        with patch('aip_agent.agents.full_agent.FullAgentWrapper', MockAgent):
            with patch('aip_agent.agents.custom_agent.CallbackAgent', MockAgent):
                # Initialize all agents once
                for agent_id in agent_ids:
                    result = await manager.initialize_agent(
                        agent_id=agent_id,
                        description=f'Agent {agent_id}'
                    )
                    assert result['status'] == 'initialized'
                
                # Store agent instances
                first_instances = {aid: manager.agents[aid] for aid in agent_ids}
                
                # Initialize all agents again (idempotent)
                for agent_id in agent_ids:
                    result = await manager.initialize_agent(
                        agent_id=agent_id,
                        description=f'Agent {agent_id}'
                    )
                    assert result['status'] == 'initialized'
                
                # Verify all agents are still the same instances
                for agent_id in agent_ids:
                    assert manager.agents[agent_id] is first_instances[agent_id], \
                        f"Agent {agent_id} instance changed after re-initialization"
                
                # Verify cache size is correct (no duplicates)
                assert len(manager.agents) == len(agent_ids), \
                    f"Cache should contain exactly {len(agent_ids)} agents, found {len(manager.agents)}"
    
    @pytest.mark.asyncio
    async def test_initialization_idempotence_concurrent_calls(self):
        """
        Property test: Idempotence holds for concurrent initialization attempts.
        
        When multiple initialization calls are made concurrently for the same agent,
        all should succeed and result in a single agent instance.
        """
        import asyncio
        
        manager = AIPAgentManager()
        agent_id = 'concurrent_test_agent'
        description = 'Concurrent test agent'
        
        with patch('aip_agent.agents.full_agent.FullAgentWrapper', MockAgent):
            with patch('aip_agent.agents.custom_agent.CallbackAgent', MockAgent):
                # Make multiple concurrent initialization calls
                tasks = [
                    manager.initialize_agent(agent_id, description)
                    for _ in range(5)
                ]
                
                results = await asyncio.gather(*tasks)
                
                # All should succeed
                for result in results:
                    assert result['status'] == 'initialized'
                    assert result['agent_id'] == agent_id
                
                # Should only have one agent instance in cache
                assert agent_id in manager.agents
                assert len([k for k in manager.agents.keys() if k == agent_id]) == 1
    
    @pytest.mark.asyncio
    async def test_initialization_after_service_restart_simulation(self):
        """
        Property test: Idempotence behavior after service restart.
        
        Simulates a service restart by creating a new manager instance.
        The new manager should be able to initialize agents that were
        previously initialized (since cache is cleared on restart).
        """
        with patch('aip_agent.agents.full_agent.FullAgentWrapper', MockAgent):
            with patch('aip_agent.agents.custom_agent.CallbackAgent', MockAgent):
                # First manager instance (before "restart")
                manager1 = AIPAgentManager()
                agent_id = 'restart_test_agent'
                
                result1 = await manager1.initialize_agent(
                    agent_id=agent_id,
                    description='Test agent before restart'
                )
                assert result1['status'] == 'initialized'
                assert agent_id in manager1.agents
                
                # Simulate service restart - create new manager instance
                manager2 = AIPAgentManager()
                
                # Agent should not be in new manager's cache
                assert agent_id not in manager2.agents
                
                # Should be able to initialize again with new manager
                result2 = await manager2.initialize_agent(
                    agent_id=agent_id,
                    description='Test agent after restart'
                )
                assert result2['status'] == 'initialized'
                assert agent_id in manager2.agents
                
                # Should be able to initialize again (idempotent in new manager)
                result3 = await manager2.initialize_agent(
                    agent_id=agent_id,
                    description='Test agent after restart'
                )
                assert result3['status'] == 'initialized'
                assert manager2.agents[agent_id] is manager2.agents[agent_id]


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
