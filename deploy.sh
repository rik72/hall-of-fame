#!/bin/bash

# Hall of Fame Webapp AWS Deployment Script
# This script deploys the webapp to AWS S3 and optionally sets up CloudFront

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="hall-of-fame-webapp"
REGION="eu-west-1"
CLOUDFRONT_ENABLED=false

echo -e "${BLUE}🚀 Hall of Fame Webapp AWS Deployment${NC}"
echo "=================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first:${NC}"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! AWS_PROFILE=hall-of-fame aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run:${NC}"
    echo "   aws configure --profile hall-of-fame"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI and credentials verified${NC}"

# Create S3 bucket if it doesn't exist
echo -e "${YELLOW}📦 Creating S3 bucket: $BUCKET_NAME${NC}"
if AWS_PROFILE=hall-of-fame aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${GREEN}✅ Bucket already exists${NC}"
else
    AWS_PROFILE=hall-of-fame aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
    echo -e "${GREEN}✅ Bucket created successfully${NC}"
fi

# Note: You may need to manually disable block public access settings in AWS Console
echo -e "${YELLOW}⚠️  Note: If you get permission errors, manually disable block public access in S3 Console${NC}"

# Configure bucket for static website hosting
echo -e "${YELLOW}🌐 Configuring bucket for static website hosting${NC}"
AWS_PROFILE=hall-of-fame aws s3api put-bucket-website \
    --bucket "$BUCKET_NAME" \
    --website-configuration '{
        "IndexDocument": {"Suffix": "index.html"},
        "ErrorDocument": {"Key": "index.html"}
    }'

# Set bucket policy for public read access
echo -e "${YELLOW}🔓 Setting bucket policy for public access${NC}"
AWS_PROFILE=hall-of-fame aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
            }
        ]
    }'

# Configure CORS (optional - skipping for now)
echo -e "${YELLOW}🌍 CORS configuration skipped (not critical for static website)${NC}"

# Sync files to S3
echo -e "${YELLOW}📤 Uploading files to S3${NC}"
AWS_PROFILE=hall-of-fame aws s3 sync . s3://"$BUCKET_NAME" \
    --exclude "node_modules/*" \
    --exclude ".git/*" \
    --exclude "*.log" \
    --exclude "aws-deployment-config.json" \
    --exclude "deploy.sh" \
    --exclude "package-lock.json" \
    --exclude "README.md" \
    --exclude "CHANGELOG.md" \
    --exclude "CODE_INSTRUCTIONS.md" \
    --exclude "TEXT_MANAGEMENT_GUIDE.md" \
    --exclude "improvements_todo.md" \
    --exclude "AI-README.md" \
    --exclude "screenshots/*" \
    --delete

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

# Get the website endpoint
WEBSITE_ENDPOINT=$(AWS_PROFILE=hall-of-fame aws s3api get-bucket-website --bucket "$BUCKET_NAME" --query 'WebsiteEndpoint' --output text)
echo -e "${GREEN}🌐 Your website is now live at:${NC}"
echo -e "${BLUE}   http://$WEBSITE_ENDPOINT${NC}"

# Optional: Set up CloudFront distribution
if [ "$CLOUDFRONT_ENABLED" = true ]; then
    echo -e "${YELLOW}☁️  Setting up CloudFront distribution...${NC}"
    
    # Create CloudFront distribution
    DISTRIBUTION_ID=$(aws cloudfront create-distribution \
        --distribution-config '{
            "CallerReference": "'$(date +%s)'",
            "Comment": "Hall of Fame Webapp",
            "DefaultRootObject": "index.html",
            "Enabled": true,
            "PriceClass": "PriceClass_100",
            "Origins": {
                "Quantity": 1,
                "Items": [
                    {
                        "Id": "S3-'$BUCKET_NAME'",
                        "DomainName": "'$BUCKET_NAME'.s3-website-'$REGION'.amazonaws.com",
                        "CustomOriginConfig": {
                            "HTTPPort": 80,
                            "HTTPSPort": 443,
                            "OriginProtocolPolicy": "http-only"
                        }
                    }
                ]
            },
            "DefaultCacheBehavior": {
                "TargetOriginId": "S3-'$BUCKET_NAME'",
                "ViewerProtocolPolicy": "redirect-to-https",
                "AllowedMethods": {
                    "Quantity": 2,
                    "Items": ["GET", "HEAD"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                },
                "ForwardedValues": {
                    "QueryString": false,
                    "Cookies": {
                        "Forward": "none"
                    }
                },
                "MinTTL": 0,
                "DefaultTTL": 86400,
                "MaxTTL": 31536000
            },
            "CustomErrorResponses": {
                "Quantity": 1,
                "Items": [
                    {
                        "ErrorCode": 404,
                        "ResponseCode": "200",
                        "ResponsePagePath": "/index.html"
                    }
                ]
            }
        }' \
        --query 'Distribution.Id' \
        --output text)
    
    echo -e "${GREEN}✅ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
    echo -e "${YELLOW}⏳ CloudFront is deploying... This may take 10-15 minutes${NC}"
    echo -e "${BLUE}   You can check the status in the AWS Console${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   • S3 Bucket: $BUCKET_NAME"
echo -e "   • Website URL: http://$WEBSITE_ENDPOINT"
if [ "$CLOUDFRONT_ENABLED" = true ]; then
    echo -e "   • CloudFront Distribution: $DISTRIBUTION_ID"
    echo -e "   • CloudFront URL: https://$DISTRIBUTION_ID.cloudfront.net (after deployment)"
fi
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • To update your site, run this script again"
echo -e "   • Monitor costs in AWS Cost Explorer"
echo -e "   • Consider setting up a custom domain with Route 53"
echo "" 