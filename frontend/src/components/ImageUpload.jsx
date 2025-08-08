import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = ({ onIngredientsDetected }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onIngredientsDetected(data.ingredients);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not detect ingredients');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <label>
        <strong>Upload Fridge Photo:</strong>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </label>
      {loading && <p>Detecting ingredients…</p>}
      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{ maxWidth: '100%', marginTop: '1rem', borderRadius: 8 }}
        />
      )}
    </div>
  );
};

export default ImageUpload;