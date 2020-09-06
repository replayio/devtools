import React, { useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import LoginButton from "ui/components/LoginButton";
import Avatar from "ui/components/Avatar";
import "./Header.css";

import { features } from "ui/utils/prefs";
import { string } from "prop-types";

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

  render() {
    const { loading, uploading } = this.props;
    const isLoaded = loading == 100;
    const upload = uploading?.totalMb
      ? `${(uploading?.uploadedMb / uploading?.totalMB) * 100}%`
      : `${uploading?.uploadedMB}MB`;

    return (
      <>
        <div id="header">
          <div className="logo"></div>
          {/* NOTE: Should we use the app state to set this status rather than relying on `innerText`? */}
          <div id="status"></div>
          {/* NOTE: This needs a way to determine when the upload is completed: specifically when there is no `totalMB` */}
          {uploading && <div className="upload-status">{upload}</div>}
          <div className="links">
            <a id="headway" onClick={this.toggleHeadway}>
              What&apos;s new
            </a>
            {this.renderAvatars()}
            {features.auth0 ? <LoginButton /> : null}
          </div>
        </div>
        {!isLoaded && <div className="loading-bar" style={{ width: `${loading}%` }}></div>}
      </>
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
