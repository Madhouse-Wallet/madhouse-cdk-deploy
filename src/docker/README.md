# dockerfile

This file basically downloads github cli and pulls the code to be built. The main thing is that you will have to manually fill out an otp link in the middle of build. the exact link takes you here https://github.com/login/device with a otp code that is presented in the build logs.



The only command to run is this here:
madhouse-cdk-deploy\src\docker> 

1. The orginal code base must be built on linux and must be deployed via commands in docker file if you want to build locally
2. Run the following command below: 

docker build --build-arg BRANCH=branch-to-deploy -t wallet-frontend .

I then launch the image from docker desktop. The other thing is for this to be properly hosted by the ALB in AWS we need the site to be on port 80. This will need to be updated in the frontend wallet code. 