import config from '../../config';

let logger
if (config.env == 'test' || config.env == 'local' || config.env == 'development') {
  logger = console
} else {
  // TODO: Add sentry or something here
  logger = console
}

export default logger
