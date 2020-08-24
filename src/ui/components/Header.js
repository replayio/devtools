import React, { useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import LoginButton from "ui/components/LoginButton";
import { getAvatarColor } from "ui/utils/user";
import "./Header.css";

import { useAuth0 } from "@auth0/auth0-react";
import { features } from "ui/utils/prefs";

const Avatar = props => {
  let { player, isFirstPlayer } = props;
  let auth = useAuth0();

  if (auth.isAuthenticated && isFirstPlayer) {
    return (
      <div className={`avatar authenticated first-player`}>
        <img src={auth.user.picture} alt={auth.user.name} />
        <span className="avatar-name">{auth.user.name}</span>
      </div>
    );
  }

  return (
    <div
      className={`avatar ${isFirstPlayer ? "first-player" : ""}`}
      style={{ background: getAvatarColor(player?.avatarID) }}
    />
  );
};

class Header extends React.Component {
  componentDidMount() {
    if (typeof Headway === "object") {
      // @see https://docs.headwayapp.co/widget for more configuration options.
      Headway.init(HW_config);
    }
  }

  toggleHeadway = () => {
    Headway.toggle();
  };

  renderAvatars() {
    const { user, getActiveUsers } = this.props;

    const activeUsers = getActiveUsers();
    const firstPlayer = this.props.user;
    const otherPlayers = activeUsers.filter(user => user.id != firstPlayer.id);

    // We sort the other players by ID here to prevent them from shuffling.
    const sortedOtherPlayers = otherPlayers.sort((a, b) => a.id - b.id);

    return (
      <div className="avatars">
        <Avatar player={firstPlayer} isFirstPlayer={true} />
        {sortedOtherPlayers.map(player => (
          <Avatar player={player} isFirstPlayer={false} key={player.id} />
        ))}
      </div>
    );
  }

  renderAvatar(player, isFirstPlayer) {
    return (
      <div
        key={player.avatarID}
        className={`avatar ${isFirstPlayer ? "first-player" : ""}`}
        style={{ background: this.getAvatarColor(player.avatarID) }}
      ></div>
    );
  }

  render() {
    return (
      <div id="header">
        <div className="logo"></div>
        <div id="status"></div>
        <div className="links">
          <a id="headway" onClick={this.toggleHeadway}>
            What&apos;s new
          </a>
          {this.renderAvatars()}
          {features.auth0 ? <LoginButton /> : null}
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    user: selectors.getUser(state),
    users: selectors.getUsers(state),
  }),
  { seek: actions.seek, getActiveUsers: actions.getActiveUsers }
)(Header);
