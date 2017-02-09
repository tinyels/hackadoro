require('dotenv').config();

export const v1Protocol = process.env.V1Protocol;
export const v1Port = process.env.V1Port;
export const v1Host = process.env.V1Host;
export const v1Instance = process.env.V1Instance;
export const v1AccessToken = process.env.V1AccessToken;
export const v1RootUrl = `${v1Protocol}://${v1Host}:${v1Port}/${v1Instance}`;


export const PORT = process.env.PORT;
export const VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN;

export const SLACKBOT_HOST_NAME = process.env.SLACKBOT_HOST_NAME;
export const SLACK_API_TOKEN= process.env.SLACK_API_TOKEN;

export const SLACKBOT_PATH = `/services/hooks/slackbot?token=${SLACK_API_TOKEN}`;
export const SLACKBOT_URL = `${SLACKBOT_HOST_NAME}${SLACKBOT_PATH}`;
