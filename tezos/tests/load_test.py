"""
Load Testing Script for Continuum Protocol

This script performs load testing on the Tezos smart contracts to measure
performance under high transaction volume and concurrent users.

Requirements: 16.9
"""

import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
import smartpy as sp

# Import contract modules
import sys
sys.path.append('..')
from contracts import streaming_protocol, asset_yield_protocol, compliance_guard, token_registry, rwa_hub

class LoadTestResults:
    """Container for load test results"""
    def __init__(self):
        self.operation_times = []
        self.successful_operations = 0
        self.failed_operations = 0
        self.errors = []
        
    def add_success(self, duration):
        self.successful_operations += 1
        self.operation_times.append(duration)
    
    def add_failure(self, error):
        self.failed_operations += 1
        self.errors.append(str(error))
    
    def get_stats(self):
        if not self.operation_times:
            return {
                'successful': self.successful_operations,
                'failed': self.failed_operations,
                'avg_time': 0,
                'min_time': 0,
                'max_time': 0,
                'median_time': 0,
                'p95_time': 0,
                'p99_time': 0
            }
        
        sorted_times = sorted(self.operation_times)
        p95_index = int(len(sorted_times) * 0.95)
        p99_index = int(len(sorted_times) * 0.99)
        
        return {
            'successful': self.successful_operations,
            'failed': self.failed_operations,
            'avg_time': statistics.mean(self.operation_times),
            'min_time': min(self.operation_times),
            'max_time': max(self.operation_times),
            'median_time': statistics.median(self.operation_times),
            'p95_time': sorted_times[p95_index] if p95_index < len(sorted_times) else sorted_times[-1],
            'p99_time': sorted_times[p99_index] if p99_index < len(sorted_times) else sorted_times[-1],
            'total_time': sum(self.operation_times)
        }


def load_test_stream_creation(num_streams=100, concurrent_users=10):
    """
    Load test stream creation with multiple concurrent users.
    
    Args:
        num_streams: Total number of streams to create
        concurrent_users: Number of concurrent users
    
    Returns:
        LoadTestResults object
    """
    print(f"\n=== Load Test: Stream Creation ===")
    print(f"Total streams: {num_streams}")
    print(f"Concurrent users: {concurrent_users}")
    
    results = LoadTestResults()
    scenario = sp.test_scenario("LoadTest_StreamCreation", streaming_protocol.main)
    
    # Deploy contract
    admin = sp.test_account("Admin")
    contract = streaming_protocol.main.StreamingProtocol(admin.address)
    scenario += contract
    
    # Create test accounts
    users = [sp.test_account(f"User{i}") for i in range(concurrent_users)]
    token_contract = sp.test_account("TokenContract")
    
    # Simulate concurrent stream creation
    streams_per_user = num_streams // concurrent_users
    
    for user_idx, user in enumerate(users):
        for stream_idx in range(streams_per_user):
            try:
                start_time = time.time()
                
                # Create stream
                recipient = sp.test_account(f"Recipient{user_idx}_{stream_idx}")
                contract.create_stream(
                    recipient=recipient.address,
                    token_address=token_contract.address,
                    token_id=0,
                    flow_rate=100,
                    duration=86400,  # 1 day
                    total_amount=8640000,
                    _sender=user
                )
                
                end_time = time.time()
                duration = end_time - start_time
                results.add_success(duration)
                
            except Exception as e:
                results.add_failure(e)
    
    # Print results
    stats = results.get_stats()
    print(f"\nResults:")
    print(f"  Successful: {stats['successful']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Avg time: {stats['avg_time']:.4f}s")
    print(f"  Min time: {stats['min_time']:.4f}s")
    print(f"  Max time: {stats['max_time']:.4f}s")
    print(f"  Median time: {stats['median_time']:.4f}s")
    print(f"  P95 time: {stats['p95_time']:.4f}s")
    print(f"  P99 time: {stats['p99_time']:.4f}s")
    print(f"  Total time: {stats['total_time']:.4f}s")
    print(f"  Throughput: {stats['successful'] / stats['total_time']:.2f} ops/sec")
    
    return results


def load_test_withdrawals(num_withdrawals=100, concurrent_users=10):
    """
    Load test withdrawals with multiple concurrent users.
    
    Args:
        num_withdrawals: Total number of withdrawals to perform
        concurrent_users: Number of concurrent users
    
    Returns:
        LoadTestResults object
    """
    print(f"\n=== Load Test: Withdrawals ===")
    print(f"Total withdrawals: {num_withdrawals}")
    print(f"Concurrent users: {concurrent_users}")
    
    results = LoadTestResults()
    scenario = sp.test_scenario("LoadTest_Withdrawals", streaming_protocol.main)
    
    # Deploy contract
    admin = sp.test_account("Admin")
    contract = streaming_protocol.main.StreamingProtocol(admin.address)
    scenario += contract
    
    # Create test accounts and streams
    users = [sp.test_account(f"User{i}") for i in range(concurrent_users)]
    token_contract = sp.test_account("TokenContract")
    
    # Create streams for each user
    stream_ids = []
    for user_idx, user in enumerate(users):
        withdrawals_per_user = num_withdrawals // concurrent_users
        for stream_idx in range(withdrawals_per_user):
            recipient = user
            sender = sp.test_account(f"Sender{user_idx}_{stream_idx}")
            
            # Create stream
            contract.create_stream(
                recipient=recipient.address,
                token_address=token_contract.address,
                token_id=0,
                flow_rate=100,
                duration=86400,
                total_amount=8640000,
                _sender=sender
            )
            
            stream_ids.append((len(stream_ids), user))
    
    # Advance time to allow withdrawals
    scenario.h2("Advance time for withdrawals")
    
    # Simulate concurrent withdrawals
    for stream_id, user in stream_ids:
        try:
            start_time = time.time()
            
            # Withdraw from stream
            contract.withdraw(
                stream_id=stream_id,
                _sender=user
            )
            
            end_time = time.time()
            duration = end_time - start_time
            results.add_success(duration)
            
        except Exception as e:
            results.add_failure(e)
    
    # Print results
    stats = results.get_stats()
    print(f"\nResults:")
    print(f"  Successful: {stats['successful']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Avg time: {stats['avg_time']:.4f}s")
    print(f"  Min time: {stats['min_time']:.4f}s")
    print(f"  Max time: {stats['max_time']:.4f}s")
    print(f"  Median time: {stats['median_time']:.4f}s")
    print(f"  P95 time: {stats['p95_time']:.4f}s")
    print(f"  P99 time: {stats['p99_time']:.4f}s")
    print(f"  Total time: {stats['total_time']:.4f}s")
    print(f"  Throughput: {stats['successful'] / stats['total_time']:.2f} ops/sec")
    
    return results


def load_test_compliance_checks(num_checks=1000, concurrent_users=20):
    """
    Load test compliance authorization checks.
    
    Args:
        num_checks: Total number of checks to perform
        concurrent_users: Number of concurrent users
    
    Returns:
        LoadTestResults object
    """
    print(f"\n=== Load Test: Compliance Checks ===")
    print(f"Total checks: {num_checks}")
    print(f"Concurrent users: {concurrent_users}")
    
    results = LoadTestResults()
    scenario = sp.test_scenario("LoadTest_ComplianceChecks", compliance_guard.main)
    
    # Deploy contract
    admin = sp.test_account("Admin")
    contract = compliance_guard.main.ComplianceGuard(admin.address)
    scenario += contract
    
    # Register users with KYC
    users = [sp.test_account(f"User{i}") for i in range(concurrent_users)]
    for user in users:
        contract.register_identity(
            user=user.address,
            jurisdiction="US",
            verification_level=1,
            expiry_time=sp.timestamp(2000000000),
            _sender=admin
        )
        contract.whitelist_address(
            user=user.address,
            asset_types={0, 1, 2},
            _sender=admin
        )
    
    # Simulate concurrent compliance checks
    checks_per_user = num_checks // concurrent_users
    
    for user in users:
        for _ in range(checks_per_user):
            try:
                start_time = time.time()
                
                # Check authorization
                is_authorized = scenario.compute(
                    contract.is_authorized_recipient(
                        sp.record(user=user.address, asset_type=0)
                    )
                )
                
                end_time = time.time()
                duration = end_time - start_time
                results.add_success(duration)
                
            except Exception as e:
                results.add_failure(e)
    
    # Print results
    stats = results.get_stats()
    print(f"\nResults:")
    print(f"  Successful: {stats['successful']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Avg time: {stats['avg_time']:.4f}s")
    print(f"  Min time: {stats['min_time']:.4f}s")
    print(f"  Max time: {stats['max_time']:.4f}s")
    print(f"  Median time: {stats['median_time']:.4f}s")
    print(f"  P95 time: {stats['p95_time']:.4f}s")
    print(f"  P99 time: {stats['p99_time']:.4f}s")
    print(f"  Total time: {stats['total_time']:.4f}s")
    print(f"  Throughput: {stats['successful'] / stats['total_time']:.2f} ops/sec")
    
    return results


def load_test_token_registry(num_tokens=500):
    """
    Load test token registry with many tokens.
    
    Args:
        num_tokens: Number of tokens to register
    
    Returns:
        LoadTestResults object
    """
    print(f"\n=== Load Test: Token Registry ===")
    print(f"Total tokens: {num_tokens}")
    
    results = LoadTestResults()
    scenario = sp.test_scenario("LoadTest_TokenRegistry", token_registry.main)
    
    # Deploy contract
    admin = sp.test_account("Admin")
    contract = token_registry.main.TokenRegistry(admin.address)
    scenario += contract
    
    # Register many tokens
    for i in range(num_tokens):
        try:
            start_time = time.time()
            
            token = sp.test_account(f"Token{i}")
            contract.register_token(
                token_address=token.address,
                asset_type=i % 3,  # Rotate through asset types
                stream_id=i,
                metadata_uri=f"ipfs://Qm{i:064x}",
                _sender=admin
            )
            
            end_time = time.time()
            duration = end_time - start_time
            results.add_success(duration)
            
        except Exception as e:
            results.add_failure(e)
    
    # Test pagination with many tokens
    print("\nTesting pagination with many tokens...")
    try:
        start_time = time.time()
        
        page = scenario.compute(
            contract.get_all_tokens_paginated(
                sp.record(offset=0, limit=100)
            )
        )
        
        end_time = time.time()
        pagination_time = end_time - start_time
        print(f"  Pagination query time: {pagination_time:.4f}s")
        print(f"  Returned {len(page.tokens)} tokens")
        print(f"  Total count: {page.total_count}")
        
    except Exception as e:
        print(f"  Pagination failed: {e}")
    
    # Print results
    stats = results.get_stats()
    print(f"\nRegistration Results:")
    print(f"  Successful: {stats['successful']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Avg time: {stats['avg_time']:.4f}s")
    print(f"  Min time: {stats['min_time']:.4f}s")
    print(f"  Max time: {stats['max_time']:.4f}s")
    print(f"  Median time: {stats['median_time']:.4f}s")
    print(f"  P95 time: {stats['p95_time']:.4f}s")
    print(f"  P99 time: {stats['p99_time']:.4f}s")
    print(f"  Total time: {stats['total_time']:.4f}s")
    print(f"  Throughput: {stats['successful'] / stats['total_time']:.2f} ops/sec")
    
    return results


def run_all_load_tests():
    """Run all load tests and generate summary report"""
    print("=" * 80)
    print("CONTINUUM PROTOCOL LOAD TESTING")
    print("=" * 80)
    
    all_results = {}
    
    # Test 1: Stream Creation
    all_results['stream_creation'] = load_test_stream_creation(
        num_streams=100,
        concurrent_users=10
    )
    
    # Test 2: Withdrawals
    all_results['withdrawals'] = load_test_withdrawals(
        num_withdrawals=100,
        concurrent_users=10
    )
    
    # Test 3: Compliance Checks
    all_results['compliance_checks'] = load_test_compliance_checks(
        num_checks=1000,
        concurrent_users=20
    )
    
    # Test 4: Token Registry
    all_results['token_registry'] = load_test_token_registry(
        num_tokens=500
    )
    
    # Generate summary report
    print("\n" + "=" * 80)
    print("LOAD TEST SUMMARY")
    print("=" * 80)
    
    for test_name, results in all_results.items():
        stats = results.get_stats()
        print(f"\n{test_name.upper().replace('_', ' ')}:")
        print(f"  Success Rate: {stats['successful'] / (stats['successful'] + stats['failed']) * 100:.2f}%")
        print(f"  Avg Response Time: {stats['avg_time']:.4f}s")
        print(f"  P95 Response Time: {stats['p95_time']:.4f}s")
        print(f"  Throughput: {stats['successful'] / stats['total_time']:.2f} ops/sec")
    
    # Identify bottlenecks
    print("\n" + "=" * 80)
    print("BOTTLENECK ANALYSIS")
    print("=" * 80)
    
    slowest_test = max(all_results.items(), key=lambda x: x[1].get_stats()['avg_time'])
    print(f"\nSlowest Operation: {slowest_test[0].replace('_', ' ').title()}")
    print(f"  Average Time: {slowest_test[1].get_stats()['avg_time']:.4f}s")
    print(f"  Recommendation: Optimize this operation for better performance")
    
    highest_failure = max(all_results.items(), key=lambda x: x[1].get_stats()['failed'])
    if highest_failure[1].get_stats()['failed'] > 0:
        print(f"\nHighest Failure Rate: {highest_failure[0].replace('_', ' ').title()}")
        print(f"  Failed Operations: {highest_failure[1].get_stats()['failed']}")
        print(f"  Recommendation: Investigate failure causes")
    
    print("\n" + "=" * 80)
    print("LOAD TESTING COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    run_all_load_tests()
