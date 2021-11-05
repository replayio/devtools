def devtools(working_directory=config.main_dir, api='https://api.replay.io/v1/graphql', dispatch='wss://dispatch.replay.io'):
  local_resource("devtools deps", "npm install", deps=["package.json"], dir=working_directory)
  local_resource("devtools webpack", serve_cmd="npm run dev", deps=[], resource_deps=["devtools deps"], serve_dir=working_directory, serve_env={"NEXT_PUBLIC_API_URL": api, "NEXT_PUBLIC_DISPATCH_URL": dispatch})
