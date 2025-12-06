#!/bin/bash

# Cyrano AI Platform - Quick Deployment Script
# Usage: ./deploy.sh [platform]
# Platforms: railway, render, vercel, fly, docker

set -e

PLATFORM=${1:-railway}
echo "🚀 Deploying Cyrano AI Platform to $PLATFORM..."

# Check if required files exist
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        echo "⚠️  .env file not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo "✅ Created .env from template. Please edit it with your API keys."
        else
            echo "❌ .env.example not found. Please create .env manually."
            exit 1
        fi
    fi
    
    echo "✅ Dependencies check passed"
}

# Generate secure secrets
generate_secrets() {
    if ! grep -q "your-super-secure-random-string" .env; then
        echo "✅ Secrets already configured"
        return
    fi
    
    echo "🔐 Generating secure secrets..."
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    sed -i.bak "s/your-super-secure-random-string-here/$SESSION_SECRET/" .env
    sed -i.bak "s/another-super-secure-random-string-here/$JWT_SECRET/" .env
    rm -f .env.bak
    
    echo "✅ Secure secrets generated"
}

# Deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        echo "📦 Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    echo "🔐 Logging in to Railway..."
    railway login
    
    echo "🚀 Creating project and deploying..."
    railway up
    
    echo "📊 Adding PostgreSQL database..."
    railway add postgresql
    
    echo "🔧 Setting environment variables..."
    railway variables set NODE_ENV=production
    
    echo "✅ Railway deployment complete!"
    echo "🌐 Your app will be available at the URL shown above"
}

# Deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    echo "📋 Please follow these steps:"
    echo "1. Go to https://render.com and sign up"
    echo "2. Click 'New +' → 'Blueprint'"
    echo "3. Connect your GitHub repository"
    echo "4. Render will use the render.yaml file to deploy automatically"
    echo "5. Add your API keys in the Render dashboard"
    echo "✅ render.yaml configuration is ready!"
}

# Deploy to Vercel
deploy_vercel() {
    echo "⚡ Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "🚀 Deploying..."
    vercel --prod
    
    echo "✅ Vercel deployment complete!"
    echo "📝 Don't forget to add your environment variables in the Vercel dashboard"
}

# Deploy to Fly.io
deploy_fly() {
    echo "🪂 Deploying to Fly.io..."
    
    if ! command -v flyctl &> /dev/null; then
        echo "📦 Installing Fly CLI..."
        curl -L https://fly.io/install.sh | sh
        export PATH="$HOME/.fly/bin:$PATH"
    fi
    
    echo "🔐 Logging in to Fly.io..."
    flyctl auth login
    
    echo "🚀 Launching application..."
    flyctl launch --no-deploy
    
    echo "📊 Creating PostgreSQL database..."
    flyctl postgres create
    
    echo "🔧 Setting secrets..."
    flyctl secrets set NODE_ENV=production
    
    echo "🚀 Deploying..."
    flyctl deploy
    
    echo "✅ Fly.io deployment complete!"
}

# Build Docker image
deploy_docker() {
    echo "🐳 Building Docker image..."
    
    docker build -t cyrano-ai-platform .
    
    echo "✅ Docker image built successfully!"
    echo "🚀 To run locally: docker run -p 5000:5000 --env-file .env cyrano-ai-platform"
    echo "📤 To push to registry: docker tag cyrano-ai-platform your-registry/cyrano-ai-platform"
}

# Main deployment logic
main() {
    echo "🎯 Cyrano AI Platform Deployment Script"
    echo "========================================="
    
    check_dependencies
    generate_secrets
    
    case $PLATFORM in
        railway)
            deploy_railway
            ;;
        render)
            deploy_render
            ;;
        vercel)
            deploy_vercel
            ;;
        fly)
            deploy_fly
            ;;
        docker)
            deploy_docker
            ;;
        *)
            echo "❌ Unknown platform: $PLATFORM"
            echo "Available platforms: railway, render, vercel, fly, docker"
            exit 1
            ;;
    esac
    
    echo ""
    echo "🎉 Deployment script completed!"
    echo "📖 Check FREE_HOSTING_GUIDE.md for detailed setup instructions"
    echo "🔧 Remember to configure your AI API keys in the hosting platform dashboard"
}

main