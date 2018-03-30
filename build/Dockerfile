FROM node:8.9@sha256:5afc7736a71bcf24281d9dbff878c771106e0791d56949b1a4e8d27c50424283

RUN apt-get update && \
    apt-get install -y xorg xvfb libxss-dev libgtk2.0-0 gconf2 libnss3 libasound2

ENV CXX="g++-4.9"
ENV CC="gcc-4.9"
ENV DISPLAY=:99.0

WORKDIR /app

ENTRYPOINT ["sh", "-c", "(Xvfb $DISPLAY -screen 0 1024x768x16 &) && npm run test"]