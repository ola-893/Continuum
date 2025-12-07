# Use Python 3.10 slim image for smaller size
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install AIP Agent SDK from GitHub
# Uncomment when ready to use real SDK
# RUN pip install --no-cache-dir git+https://github.com/unibaseio/aip-agent.git@main

# Copy application code
COPY . .

# Create directory for logs
RUN mkdir -p /app/logs

# Expose port
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/health')"

# Run the application
CMD ["python", "app.py"]
