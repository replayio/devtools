function pushModal(to: string, history: any, location: any) {
  const previous = location?.state?.previous;
  if (location.state?.modal) {
    history.replace(to, { modal: true, previous });
  } else {
    history.push(to, { modal: true, previous: location });
  }
}

export { pushModal };
