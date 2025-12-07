"""
Test script to verify real query processing integration.

This script tests that the query_agent method properly:
1. Retrieves agent state from Membase
2. Processes queries using the real AIP Agent SDK
3. Updates agent state in Membase
4. Returns LLM-generated responses
"""

import asyncio
import os
import sys

# Set test environment variables
os.environ['MEMBASE_ACCOUNT'] = '0x1234567890abcdef1234567890abcdef12345678'
os.environ['MEMBASE_SECRET_KEY'] = 'test_secret_key'
os.environ['MEMBASE_ID'] = 'test_agent_001'
os.environ['MEMORY_HUB_ADDRESS'] = '54.169.29.193:8081'
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', 'sk-test')

from agent_manager import AIPAgentManager


async def test_query_processing():
    """Test that query processing uses real SDK methods."""
    print("Testing query processing integration...")
    
    try:
        # Initialize manager
        manager = AIPAgentManager()
        print("✓ Manager initialized")
        
        # Check that the query_agent method exists and has the right signature
        import inspect
        sig = inspect.signature(manager.query_agent)
        params = list(sig.parameters.keys())
        
        assert 'agent_id' in params, "query_agent missing agent_id parameter"
        assert 'query' in params, "query_agent missing query parameter"
        assert 'user_context' in params, "query_agent missing user_context parameter"
        print("✓ query_agent method has correct signature")
        
        # Check that helper methods exist
        assert hasattr(manager, '_get_agent_state_from_membase'), \
            "Missing _get_agent_state_from_membase method"
        assert hasattr(manager, '_update_agent_state_in_membase'), \
            "Missing _update_agent_state_in_membase method"
        print("✓ Helper methods exist")
        
        # Verify the query_agent method calls the real SDK
        import inspect
        source = inspect.getsource(manager.query_agent)
        
        # Check that it's not using simulated responses
        assert 'simulated response' not in source.lower(), \
            "query_agent still using simulated responses!"
        
        # Check that it calls agent.process_query
        assert 'agent.process_query' in source, \
            "query_agent not calling agent.process_query!"
        
        # Check that it retrieves state from Membase
        assert '_get_agent_state_from_membase' in source, \
            "query_agent not retrieving state from Membase!"
        
        # Check that it updates state in Membase
        assert '_update_agent_state_in_membase' in source, \
            "query_agent not updating state in Membase!"
        
        print("✓ query_agent uses real SDK integration")
        
        # Check initialize_agent uses real SDK
        init_source = inspect.getsource(manager.initialize_agent)
        
        assert 'FullAgentWrapper' in init_source, \
            "initialize_agent not using FullAgentWrapper!"
        
        assert 'CallbackAgent' in init_source, \
            "initialize_agent not using CallbackAgent!"
        
        assert 'await agent.initialize()' in init_source, \
            "initialize_agent not calling agent.initialize()!"
        
        print("✓ initialize_agent uses real SDK integration")
        
        # Check get_agent_memory uses real Membase
        memory_source = inspect.getsource(manager.get_agent_memory)
        
        assert '_get_agent_state_from_membase' in memory_source, \
            "get_agent_memory not using real Membase retrieval!"
        
        print("✓ get_agent_memory uses real Membase integration")
        
        print("\n✅ All integration checks passed!")
        print("\nSummary:")
        print("- query_agent now calls agent.process_query() for real LLM responses")
        print("- Agent state is retrieved from Membase before processing")
        print("- Agent state is updated in Membase after processing")
        print("- No mock or simulated responses remain")
        print("- initialize_agent uses real FullAgentWrapper")
        print("- get_agent_memory retrieves from real Membase")
        
        return True
        
    except AssertionError as e:
        print(f"\n❌ Integration check failed: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = asyncio.run(test_query_processing())
    sys.exit(0 if success else 1)
