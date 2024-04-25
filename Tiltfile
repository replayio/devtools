def devtools(working_directory=config.main_dir, api='https://api.replay.io/v1/graphql', subscriptions='wss://api.replay.io/v1/graphql', dispatch='wss://dispatch.replay.io', resource_deps=[]):
  local_resource("devtools deps", "yarn install", deps=["package.json"], dir=working_directory, allow_parallel=True)
  local_resource(
      "devtools webpack",
      serve_cmd="rm -rf .next && npm exec next dev -- -p 8081",
      deps=[],
      resource_deps=["devtools deps"] + resource_deps,
      serve_dir=working_directory,
      serve_env={
         "NEXT_PUBLIC_API_URL": api,
         "NEXT_PUBLIC_DISPATCH_URL": dispatch,
         "NEXT_PUBLIC_API_SUBSCRIPTION_URL": subscriptions,
         "DASHBOARD_URL": "http://localhost:8080"
     }
  )
