FROM node:10.13-jessie

# if left blank app will run with dev settings
# to build production image run:
# $ docker build ./api --build-args app_env=production

ARG app_env
ENV APP_ENV $app_env

WORKDIR /usr/src/app

COPY package*.json ./

RUN ["/bin/bash", "-c",  "if [[ ${APP_ENV} = production ]]; then npm i --only=production; else npm i; fi"]

COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]