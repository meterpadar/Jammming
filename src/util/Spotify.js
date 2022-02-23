let userAccessToken = '';
const clientID = ''; //Here you have to assign your spotify client ID
const redirectURI = 'http://localhost:3000';

export const Spotify = {
	getAccessToken() {
		if (userAccessToken) {
			return userAccessToken;
		};

		const url = window.location.href;
		const accessTokenMatch = url.match(/access_token=([^&]*)/);
		const expiresInMatch = url.match(/expires_in=([^&]*)/);

		if (accessTokenMatch && expiresInMatch) {
			userAccessToken = accessTokenMatch[1];
			const expiresIn = Number(expiresInMatch[1]);
			window.setTimeout(() => {
				userAccessToken = '';
			}, expiresIn * 1000);
			window.history.pushState('Access Token', null, '/');
			return userAccessToken;
		} else {
			const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
			window.location = accessUrl;
		}
	},

	search(term) {
		const accessToken = Spotify.getAccessToken();
		return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}).then(response => {
			return response.json();
		}).then(jsonResponse => {
			if (!jsonResponse.tracks) {
				return [];
			};
			return jsonResponse.tracks.items.map((track) => ({
				id: track.id,
				name: track.name,
				artist: track.artists[0].name,
				album: track.album.name,
				uri: track.uri
			}));
		})
	},

	savePlaylist(name, trackUris) {
		if (!name || !trackUris.length) {
			return;
		}

		const accessToken = Spotify.getAccessToken();
		const headers = {
			Authorization: `Bearer ${accessToken}`
		};
		let userId = '';

		return fetch(`https://api.spotify.com/v1/me`, {
			headers: headers
		}).then(response => {
			return response.json()
		}).then(jsonResponse => {
			userId = jsonResponse.id;
			return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
				method: 'POST',
				headers: headers,
				body: JSON.stringify({ name: name })
			}).then(response => {
				return response.json();
			}).then(jsonResponse => {
				const playlistID = jsonResponse.id;
				return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistID}/tracks`, {
					method: 'POST',
					headers: headers,
					body: JSON.stringify({ uris: trackUris })
				});
			});
		});
	}
}

