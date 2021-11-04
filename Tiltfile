def devtools(working_directory=config.main_dir, api='https://api.replay.io/v1/graphql', dispatch='wss://dispatch.replay.io'):
  local_resource("devtools deps", "npm install", deps=["package.json"], dir=working_directory)
  local_resource("devtools webpack", serve_cmd="npm start", deps=[], resource_deps=["devtools deps"], serve_dir=working_directory, serve_env={"API_URL": api, "DISPATCH_URL": dispatch})
