"""
Pydantic request/response models for AIP Agent microservice.

These models define the structure of API requests and responses,
providing automatic validation and serialization.
"""

from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    """Request model for agent registration."""
    agent_id: str = Field(..., description="Unique agent identifier")


class RegisterResponse(BaseModel):
    """Response model for agent registration."""
    success: bool = Field(..., description="Whether registration succeeded")
    transaction_hash: str = Field(..., description="Blockchain transaction hash")
    agent_id: str = Field(..., description="Registered agent identifier")
    wallet_address: str = Field(..., description="Wallet address that owns the agent")


class InitializeRequest(BaseModel):
    """Request model for agent initialization."""
    agent_id: str = Field(..., description="Unique agent identifier")
    description: str = Field(..., description="Agent description/system prompt")
    memory_hub_address: Optional[str] = Field(
        default="54.169.29.193:8081",
        description="Memory Hub gRPC address"
    )


class InitializeResponse(BaseModel):
    """Response model for agent initialization."""
    success: bool = Field(..., description="Whether initialization succeeded")
    agent_id: str = Field(..., description="Initialized agent identifier")
    status: str = Field(..., description="Agent status (e.g., 'initialized')")


class QueryRequest(BaseModel):
    """Request model for agent query."""
    agent_id: str = Field(..., description="Unique agent identifier")
    query: str = Field(..., description="User query string")
    user_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context data"
    )


class QueryResponse(BaseModel):
    """Response model for agent query."""
    success: bool = Field(..., description="Whether query succeeded")
    response: str = Field(..., description="Agent response text")
    agent_state: Dict[str, Any] = Field(..., description="Updated agent state")
    interaction_id: str = Field(..., description="Unique interaction identifier")


class AgentStatus(BaseModel):
    """Response model for agent status."""
    agent_id: str = Field(..., description="Agent identifier")
    status: str = Field(..., description="Agent status (active/inactive/initializing)")
    registered: bool = Field(..., description="Whether agent is registered on-chain")
    wallet_address: str = Field(..., description="Wallet address that owns the agent")
    memory_hub_connected: bool = Field(..., description="Whether connected to Memory Hub")


class AgentMemory(BaseModel):
    """Response model for agent memory."""
    agent_id: str = Field(..., description="Agent identifier")
    state: Dict[str, Any] = Field(..., description="Agent state data")
    last_updated: str = Field(..., description="Last update timestamp (ISO format)")


class ErrorDetail(BaseModel):
    """Error detail structure."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")
    retryable: bool = Field(..., description="Whether the operation can be retried")


class ErrorResponse(BaseModel):
    """Response model for errors."""
    success: bool = Field(default=False, description="Always false for errors")
    error: Dict[str, Any] = Field(..., description="Error information")


class AgentState(BaseModel):
    """Agent state structure stored in Membase."""
    version: int = Field(..., description="State version number")
    createdAt: int = Field(..., description="Creation timestamp (Unix)")
    updatedAt: int = Field(..., description="Last update timestamp (Unix)")
    membaseId: str = Field(..., description="Unique agent identifier")
    walletAddress: str = Field(..., description="BNB Chain wallet address")
    registeredOnChain: bool = Field(..., description="Whether registered on-chain")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="User preferences")
    interactionHistory: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Interaction history"
    )
    goals: List[str] = Field(default_factory=list, description="Agent goals")
    learnedSummary: str = Field(default="", description="Learned knowledge summary")
    memoryHubConnected: bool = Field(..., description="Memory Hub connection status")
    lastSyncTimestamp: int = Field(..., description="Last sync timestamp (Unix)")


class Interaction(BaseModel):
    """Interaction record structure."""
    id: str = Field(..., description="Unique interaction identifier")
    userQuery: str = Field(..., description="User query text")
    agentResponse: str = Field(..., description="Agent response text")
    timestamp: int = Field(..., description="Interaction timestamp (Unix)")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Interaction context")
