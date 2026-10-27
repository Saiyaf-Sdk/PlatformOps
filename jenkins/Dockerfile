FROM jenkins/jenkins:lts-jdk21

USER root

# Install Docker static CLI and Node.js 22 LTS with npm
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.3.1.tgz | tar -xzf - -C /usr/local/bin --strip-components=1 docker/docker \
    && curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz | tar -xzf - -C /usr/local --strip-components=1 \
    && usermod -aG root jenkins

# Copy automated Groovy initialization scripts
COPY init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/

# Install strictly required Jenkins plugins
USER jenkins
RUN jenkins-plugin-cli --plugins \
    git \
    workflow-aggregator \
    credentials-binding \
    github
