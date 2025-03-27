import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PokemonSightings.css';

const PokemonSightings = () => {
  const { pokemonId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [pokemon, setPokemon] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [customCoordinates, setCustomCoordinates] = useState({
    longitude: '',
    latitude: '',
    radius: 10
  });
  const [useCustomCoordinates, setUseCustomCoordinates] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [commentStatus, setCommentStatus] = useState('');

  const typeColors = {
    Normal: '#A8A878',
    Fire: '#F08030',
    Water: '#6890F0',
    Electric: '#F8D030',
    Grass: '#78C850',
    Ice: '#98D8D8',
    Fighting: '#C03028',
    Poison: '#A040A0',
    Ground: '#E0C068',
    Flying: '#A890F0',
    Psychic: '#F85888',
    Bug: '#A8B820',
    Rock: '#B8A038',
    Ghost: '#705898',
    Dragon: '#7038F8',
    Dark: '#705848',
    Steel: '#B8B8D0',
    Fairy: '#EE99AC',
  };

  useEffect(() => {
    const fetchPokemonSightings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/pokemon/${pokemonId}`);
        const data = response.data;

        const transformedSightings = (data.sightings || []).map(sighting => ({
          ...sighting,
          coords: sighting.location
        }));

        setPokemon(data.pokemon);
        setSightings(transformedSightings);
        setComments(data.comments || []);

        if (data.image_path) {
          setImageUrl(`http://localhost:5000/api/images/${data.image_path}`);
        } else {
          setImageUrl('https://via.placeholder.com/60?text=Pokemon');
        }

        setLoading(false);

        const initializeMap = (sightingsData) => {
          if (!mapRef.current || !window.google) return;

          let centerPoint;
          if (sightingsData.length > 0) {
            const firstSighting = sightingsData[0];
            centerPoint = {
              lat: firstSighting.coords.coordinates[1],
              lng: firstSighting.coords.coordinates[0]
            };
          } else {
            centerPoint = { lat: 35.6762, lng: 139.6503 }; // Tokyo
          }

          const mapOptions = {
            center: centerPoint,
            zoom: 10,
            mapTypeId: 'terrain'
          };

          const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
          setMap(newMap);

          // Define addSightingMarkers inside useEffect
          const addSightingMarkers = (mapInstance, sightingsToAdd) => {
            if (!mapInstance || !window.google) return;

            markers.forEach(marker => marker.setMap(null));
            const newMarkers = [];

            if (useCustomCoordinates && customCoordinates.latitude && customCoordinates.longitude) {
              const searchCircle = new window.google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.1,
                map: mapInstance,
                center: {
                  lat: parseFloat(customCoordinates.latitude),
                  lng: parseFloat(customCoordinates.longitude)
                },
                radius: customCoordinates.radius * 1000
              });

              mapInstance.setCenter({
                lat: parseFloat(customCoordinates.latitude),
                lng: parseFloat(customCoordinates.longitude)
              });

              newMarkers.push(searchCircle);
            }

            sightingsToAdd.forEach(sighting => {
              if (sighting.coords && sighting.coords.coordinates) {
                const position = {
                  lat: sighting.coords.coordinates[1],
                  lng: sighting.coords.coordinates[0]
                };

                const marker = new window.google.maps.Marker({
                  position: position,
                  map: mapInstance,
                  title: `${data.pokemon?.name} Sighting`,
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: data.pokemon?.primary_type ? typeColors[data.pokemon.primary_type] : '#FF0000',
                    fillOpacity: 0.9,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                  }
                });

                const infoContent = `
                  <div class="sighting-info-window">
                    <h3>${data.pokemon?.name} Sighting</h3>
                    <p><strong>Location:</strong> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</p>
                    <p><strong>Date:</strong> ${new Date(sighting.date || Date.now()).toLocaleDateString()}</p>
                  </div>
                `;

                const infoWindow = new window.google.maps.InfoWindow({
                  content: infoContent,
                  maxWidth: 300
                });

                marker.addListener('click', () => {
                  mapInstance.setZoom(15);
                  mapInstance.setCenter(position);
                  infoWindow.open(mapInstance, marker);
                });

                newMarkers.push(marker);
              }
            });

            setMarkers(newMarkers);
          };

          addSightingMarkers(newMap, sightingsData);
        };

        if (window.google && window.google.maps) {
          initializeMap(transformedSightings);
        } else {
          window.initMap = () => initializeMap(transformedSightings);
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAjjWBrV0bpF5HHcUuDwQK0ZH2s4JJ2XrI&callback=initMap`;
          script.async = true;
          script.onerror = () => {
            console.error('Failed to load Google Maps API');
            setError('Failed to load map. Please try again later.');
          };
          document.head.appendChild(script);
        }
      } catch (err) {
        console.error('Error fetching Pokémon sightings:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError('Failed to load Pokémon sightings. Please try again.');
        setLoading(false);
      }
    };

    fetchPokemonSightings();

    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonId]);

  const fetchFilteredSightings = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/pokemon/${pokemonId}/sightings`, {
        params: {
          latitude: parseFloat(customCoordinates.latitude),
          longitude: parseFloat(customCoordinates.longitude),
          radius: parseFloat(customCoordinates.radius)
        }
      });

      const transformedSightings = response.data.map(sighting => ({
        ...sighting,
        coords: sighting.location
      }));

      return transformedSightings;
    } catch (err) {
      console.error('Error filtering sightings by area:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to filter sightings by area.');
      return sightings;
    }
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setCustomCoordinates({
      ...customCoordinates,
      [name]: value
    });
  };

  const handleCoordinateSubmit = async (e) => {
    e.preventDefault();
    if (!customCoordinates.latitude || !customCoordinates.longitude) return;

    setUseCustomCoordinates(true);
    const filteredSightings = await fetchFilteredSightings();
    setSightings(filteredSightings);
    if (map) {
      // Re-add markers with filtered sightings
      markers.forEach(marker => marker.setMap(null));
      const newMarkers = [];

      if (filteredSightings.length > 0) {
        filteredSightings.forEach(sighting => {
          if (sighting.coords && sighting.coords.coordinates) {
            const position = {
              lat: sighting.coords.coordinates[1],
              lng: sighting.coords.coordinates[0]
            };

            const marker = new window.google.maps.Marker({
              position: position,
              map: map,
              title: `${pokemon?.name} Sighting`,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: pokemon?.primary_type ? typeColors[pokemon.primary_type] : '#FF0000',
                fillOpacity: 0.9,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              }
            });

            const infoContent = `
              <div class="sighting-info-window">
                <h3>${pokemon?.name} Sighting</h3>
                <p><strong>Location:</strong> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</p>
                <p><strong>Date:</strong> ${new Date(sighting.date || Date.now()).toLocaleDateString()}</p>
              </div>
            `;

            const infoWindow = new window.google.maps.InfoWindow({
              content: infoContent,
              maxWidth: 300
            });

            marker.addListener('click', () => {
              map.setZoom(15);
              map.setCenter(position);
              infoWindow.open(map, marker);
            });

            newMarkers.push(marker);
          }
        });

        const searchCircle = new window.google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.1,
          map: map,
          center: {
            lat: parseFloat(customCoordinates.latitude),
            lng: parseFloat(customCoordinates.longitude)
          },
          radius: customCoordinates.radius * 1000
        });

        map.setCenter({
          lat: parseFloat(customCoordinates.latitude),
          lng: parseFloat(customCoordinates.longitude)
        });

        newMarkers.push(searchCircle);
      }

      setMarkers(newMarkers);
    }
  };

  const handleResetCoordinates = async () => {
    setUseCustomCoordinates(false);
    setCustomCoordinates({
      longitude: '',
      latitude: '',
      radius: 10
    });

    const response = await axios.get(`http://localhost:5000/api/pokemon/${pokemonId}`);
    const transformedSightings = (response.data.sightings || []).map(sighting => ({
      ...sighting,
      coords: sighting.location
    }));
    setSightings(transformedSightings);

    if (map && transformedSightings.length > 0) {
      map.setCenter({
        lat: transformedSightings[0].coords.coordinates[1],
        lng: transformedSightings[0].coords.coordinates[0]
      });
      markers.forEach(marker => marker.setMap(null));
      const newMarkers = [];

      transformedSightings.forEach(sighting => {
        if (sighting.coords && sighting.coords.coordinates) {
          const position = {
            lat: sighting.coords.coordinates[1],
            lng: sighting.coords.coordinates[0]
          };

          const marker = new window.google.maps.Marker({
            position: position,
            map: map,
            title: `${pokemon?.name} Sighting`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: pokemon?.primary_type ? typeColors[pokemon.primary_type] : '#FF0000',
              fillOpacity: 0.9,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }
          });

          const infoContent = `
            <div class="sighting-info-window">
              <h3>${pokemon?.name} Sighting</h3>
              <p><strong>Location:</strong> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</p>
              <p><strong>Date:</strong> ${new Date(sighting.date || Date.now()).toLocaleDateString()}</p>
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent,
            maxWidth: 300
          });

          marker.addListener('click', () => {
            map.setZoom(15);
            map.setCenter(position);
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        }
      });

      setMarkers(newMarkers);
    }
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      setCommentStatus('Comment cannot be empty');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/pokemon/${pokemonId}/comments`, {
        text: comment,
        author: 'CurrentUser'
      });

      const newComment = response.data;
      setComments([...comments, newComment]);
      setComment('');
      setCommentStatus('Comment added successfully!');

      setTimeout(() => setCommentStatus(''), 3000);
    } catch (err) {
      console.error('Error adding comment:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setCommentStatus('Failed to add comment. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading">Loading Pokémon sightings...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/pokedex')} className="back-button">
          Back to Pokédex
        </button>
      </div>
    );
  }

  return (
    <div className="sightings-container slide-in">
      <div className="sightings-header">
        <button onClick={() => navigate('/pokedex')} className="back-button">
          ← Back to Pokédex
        </button>

        <h1>
          {pokemon?.name} Sightings
          <span className="sightings-count">
            {sightings.length} location{sightings.length !== 1 ? 's' : ''}
          </span>
        </h1>

        {pokemon && (
          <div className="pokemon-quick-info">
            <div className="pokemon-quick-image">
              <img
                src={imageUrl}
                alt={pokemon.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/60?text=Pokemon';
                }}
              />
            </div>

            <div className="pokemon-quick-types">
              <span
                className="type-badge"
                style={{ backgroundColor: typeColors[pokemon.primary_type] }}
              >
                {pokemon.primary_type}
              </span>

              {pokemon.secondary_type && (
                <span
                  className="type-badge"
                  style={{ backgroundColor: typeColors[pokemon.secondary_type] }}
                >
                  {pokemon.secondary_type}
                </span>
              )}

              {pokemon.legendary && (
                <span className="legendary-badge">Legendary</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="coordinates-form-container">
        <form onSubmit={handleCoordinateSubmit} className="coordinates-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={customCoordinates.latitude}
                onChange={handleCoordinateChange}
                step="0.000001"
                placeholder="e.g. 35.681236"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={customCoordinates.longitude}
                onChange={handleCoordinateChange}
                step="0.000001"
                placeholder="e.g. 139.767125"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="radius">Radius (km)</label>
              <input
                type="number"
                id="radius"
                name="radius"
                value={customCoordinates.radius}
                onChange={handleCoordinateChange}
                min="1"
                max="500"
                step="1"
                required
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="search-button">
                Search Area
              </button>

              <button
                type="button"
                className="reset-button"
                onClick={handleResetCoordinates}
                disabled={!useCustomCoordinates}
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        {useCustomCoordinates && (
          <div className="coordinates-info">
            Showing Pokémon within {customCoordinates.radius}km of
            {' '}{customCoordinates.latitude}, {customCoordinates.longitude}
          </div>
        )}
      </div>

      <div className="sightings-content">
        <div className="map-container">
          <div
            ref={mapRef}
            className="map-view"
            style={{ height: '500px', width: '100%' }}
          ></div>
        </div>

        <div className="sightings-list">
          <h2>All Sightings</h2>

          {sightings.length === 0 ? (
            <div className="no-sightings">
              <p>No sightings found{useCustomCoordinates ? ' in this area' : ''}.</p>
              {useCustomCoordinates && <p>Try adjusting your search radius or coordinates.</p>}
            </div>
          ) : (
            <div className="sightings-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sightings.map((sighting, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{sighting.coords.coordinates[1].toFixed(6)}</td>
                      <td>{sighting.coords.coordinates[0].toFixed(6)}</td>
                      <td>{new Date(sighting.date || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="view-on-map-btn"
                          onClick={() => {
                            if (map) {
                              map.setCenter({
                                lat: sighting.coords.coordinates[1],
                                lng: sighting.coords.coordinates[0]
                              });
                              map.setZoom(15);

                              markers.forEach(marker => {
                                if (marker.getPosition &&
                                    marker.getPosition().lat() === sighting.coords.coordinates[1] &&
                                    marker.getPosition().lng() === sighting.coords.coordinates[0]) {
                                  window.google.maps.event.trigger(marker, 'click');
                                }
                              });
                            }
                          }}
                        >
                          View on Map
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="comments-section">
        <h2>Comments</h2>

        <form onSubmit={handleCommentSubmit} className="comment-form">
          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="Share your thoughts about this Pokémon..."
            rows="3"
            className="comment-input"
          ></textarea>

          <button type="submit" className="comment-submit">
            Add Comment
          </button>

          {commentStatus && (
            <div className={`comment-status ${commentStatus.includes('Failed') ? 'error' : 'success'}`}>
              {commentStatus}
            </div>
          )}
        </form>

        <div className="comments-list">
          {comments && comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">{formatDate(comment.date)}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          ) : (
            <div className="no-comments">
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PokemonSightings;
