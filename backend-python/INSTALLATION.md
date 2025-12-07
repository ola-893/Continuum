# Python Microservice Installation Guide

## Overview

This document describes the installation of the AIP Agent SDK and all required dependencies for the Python microservice.

## Installation Steps Completed

### 1. Repository Cloning
- Cloned AIP Agent repository from https://github.com/unibaseio/aip-agent.git
- Repository location: `backend-python/aip-agent/`
- This provides local access to the SDK source code for development reference

### 2. Dependencies Installed

All dependencies have been successfully installed in a Python virtual environment:

#### Core Dependencies
- **aip-agent** (v0.1.5) - Installed from GitHub repository
- **membase** (v0.1.9) - Installed from local workspace directory
- **flask** (v3.1.2) - Web framework for REST API
- **flask-cors** (v6.0.1) - CORS support for Flask
- **web3** (v7.14.0) - Blockchain interaction library
- **python-dotenv** (v1.2.1) - Environment variable management
- **pydantic** (v2.12.4) - Data validation

#### Testing Dependencies
- **pytest** (v9.0.2) - Testing framework
- **pytest-asyncio** (v1.3.0) - Async testing support
- **pytest-cov** (v7.0.0) - Code coverage
- **hypothesis** (v6.148.7) - Property-based testing

#### Additional Dependencies
- **aiohttp** (v3.12.14) - Async HTTP client
- **requests** (v2.32.5) - HTTP client for testing
- **python-json-logger** (v4.0.0) - Structured logging

### 3. Import Verification

All key modules have been verified to import successfully:

✓ `aip_agent.agents.full_agent.FullAgentWrapper`
✓ `aip_agent.agents.agent.Agent`
✓ `membase.chain.chain.Client`
✓ `membase.chain.chain.membase_id, membase_account, membase_secret`
✓ `flask.Flask`
✓ `flask_cors.CORS`
✓ `dotenv.load_dotenv`
✓ `web3.Web3`
✓ `pydantic.BaseModel`
✓ `aiohttp`
✓ `pytest`
✓ `hypothesis`

## Virtual Environment

A Python virtual environment has been created at `backend-python/venv/`.

### Activating the Virtual Environment

```bash
cd backend-python
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

### Installing Dependencies (if needed)

```bash
pip install -r requirements.txt
```

## Requirements File

The `requirements.txt` file includes:
- Membase from local directory: `../membase`
- AIP Agent from GitHub: `git+https://github.com/unibaseio/aip-agent.git@main`
- All other dependencies with version constraints

## Environment Variables Required

Before running the Python microservice, ensure these environment variables are set:

```bash
# Blockchain Identity (REQUIRED)
MEMBASE_ACCOUNT=0x...  # Your BNB Chain wallet address
MEMBASE_SECRET_KEY=... # Your wallet private key
MEMBASE_ID=...         # Unique agent identifier

# Network Configuration
MEMBASE_NETWORK=bsc-testnet
MEMORY_HUB_ADDRESS=54.169.29.193:8081

# LLM Integration
OPENAI_API_KEY=sk-...

# Service Configuration
PORT=5000
```

## Next Steps

With all dependencies installed, you can now:
1. Configure environment variables (see `.env.example`)
2. Implement the REST API endpoints in `app.py`
3. Implement the AIP Agent wrapper in `agent_manager.py`
4. Run the Python microservice
5. Test the integration with the Node.js backend

## Verification

To verify the installation, run:

```bash
python test_imports.py
```

This will test all critical imports and confirm the installation is complete.

## Notes

- The `aip-agent/` directory is excluded from git (see `.gitignore`)
- The virtual environment `venv/` is excluded from git
- Never commit `.env` files containing private keys
- Membase is installed from the workspace root `../membase` directory
