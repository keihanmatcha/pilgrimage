import spots from './spots.json' assert { type: 'json' };
import artists from './artist.json' assert { type: 'json' };

// artist.id をキーにしたマップを作る
const artistMap = Object.fromEntries(artists.map(a => [a.id, a]));

// spots に artist 情報を結合する
const spotsWithArtist = spots.map(spot => ({
  ...spot,
  artist: artistMap[spot.artistId] || null
}));

console.log(spotsWithArtist);