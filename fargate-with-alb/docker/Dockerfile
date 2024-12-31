# Step 1: Use ubuntu latest base image
FROM ubuntu:latest

# This is the branch that will be used when building the code from wallet-frontend
ARG BRANCH

# Step 2: Install necessary dependencies: curl, gpg, git 
RUN apt update && apt install -y curl gpg git

# Step 3: Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg;
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null;
RUN apt update && apt install -y gh;

# Step 4: Install nodejs
ENV NODE_VERSION=22.12.0
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Step 5: Enable pnpm 
RUN corepack enable pnpm

# Step 6: Authenticate with GitHub (if needed for private repos)
# You will need to authenticate with an otp code to proceed
RUN gh auth login --with-token

# Step 7: Clone the repository using GitHub CLI
RUN gh repo clone 'Madhouse-Wallet/wallet-frontend' /app -- --branch ${BRANCH} 

# Step 8: Set the working directory to the cloned repository
WORKDIR /app

# Step 9: Install dependencies for the Next.js application
RUN pnpm i

# Step 10: Expose port 80 for the application
EXPOSE 80

# Step 11: Start the Next.js application in production mode on port 80
CMD pnpm dev --port 80