# Step 1: Use the official Node.js image as the base image
FROM ubuntu:latest
ARG BRANCH
ARG COMMIT=''
ARG NEXT_PUBLIC_AWS_S3_ACCESS_KEY
ARG NEXT_PUBLIC_AWS_S3_REGION
ARG NEXT_PUBLIC_AWS_S3_SECRET_KEY
ARG NEXT_PUBLIC_EMAIL


ENV NEXT_PUBLIC_AWS_S3_ACCESS_KEY=${NEXT_PUBLIC_AWS_S3_ACCESS_KEY}
ENV NEXT_PUBLIC_AWS_S3_REGION=${NEXT_PUBLIC_AWS_S3_REGION}
ENV NEXT_PUBLIC_AWS_S3_SECRET_KEY=${NEXT_PUBLIC_AWS_S3_SECRET_KEY}
ENV NEXT_PUBLIC_EMAIL=${NEXT_PUBLIC_EMAIL}

# Step 2: Install necessary dependencies: curl, bash, git, and GitHub CLI
RUN apt update && apt install -y curl gpg git

# Step 3: Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg;
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null;
RUN apt update && apt install -y gh;

#Install Node JS
ENV NODE_VERSION=18.20.5
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Step 4: Authenticate with GitHub (if needed for private repos)
# You will need to authenticate with an otp code to proceed
RUN gh auth login --with-token

# Step 5: Clone the repository using GitHub CLI
RUN gh repo clone 'Madhouse-Wallet/wallet-frontend' /app -- --branch ${BRANCH} 

# Step 6: Set the working directory to the cloned repository
WORKDIR /app

# Log the commit being used. If we filled in a specific commit param then use that. 
RUN if [ "$COMMIT" != '' ]; then \
        echo 'Switching to target branch...' && \
        git branch "${BRANCH}-${COMMIT}" "${COMMIT}" && \
        git switch "${BRANCH}-${COMMIT}"; \
    else \
        echo 'Building latest commit...' && \
        gh browse -c -n; \
    fi

# Step 7: Install dependencies for the Next.js application
RUN npm install @keep-network/tbtc-v2.ts --legacy-peer-deps
RUN npm install sharp
RUN npm install --legacy-peer-deps
RUN npm run build

# Step 9: Expose port 80 for the application
EXPOSE 80

# Step 10: Start the Next.js application in production mode on port 80
CMD npm run start -- --port 80