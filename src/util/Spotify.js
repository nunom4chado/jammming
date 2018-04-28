const clientID = 'f6d771712373469bab2e390732c5da4d';
const redirectURI = 'https://nmjammm.surge.sh';
let accessToken;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    // check is access_token and expires_in are present in the URL
    const urlHasAccessToken = window.location.href.match(/access_token=([^&]*)/);
    const urlHasExpiration = window.location.href.match(/expires_in=([^&]*)/);

    // Step 80 may be wrong
    if (urlHasAccessToken && urlHasExpiration) {
      accessToken = urlHasAccessToken[1];
      let expiresIn = urlHasExpiration[1];

      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');

      return accessToken;
    } else {
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
    }
  },

  search(term) {
    const accessToken = Spotify.getAccessToken();
    let url = `https://api.spotify.com/v1/search?type=track&q=${term}`;

    return fetch(url, {
      headers: {Authorization: `Bearer ${accessToken}`}
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Request failed');
    }, networkError => console.log(networkError.message)
    ).then(jsonResponse => {
      if (!jsonResponse.tracks) {
        return [];
      }
      return jsonResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }));
    });
  },

  savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs.length) {
      return;
    }

    const accessToken = Spotify.getAccessToken();
    const header = {Authorization: `Bearer ${accessToken}`};
    const url = 'https://api.spotify.com/v1/me';
    let userID;

    return fetch(url, {
      headers: header
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Resquest failed');
    },networkError => console.log(networkError.message)
    ).then(jsonResponse => {
      userID = jsonResponse.id;

      fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
        headers: header,
        method: 'POST',
        body: JSON.stringify({name: playlistName})
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Request failed');
      },networkError => console.log(networkError.message)
      ).then(jsonResponse => {
        let playlistID = jsonResponse.id;

        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
          headers: header,
          method: 'POST',
          body: JSON.stringify({uris: trackURIs})
        });
      });

    });
  }

}

export default Spotify;
