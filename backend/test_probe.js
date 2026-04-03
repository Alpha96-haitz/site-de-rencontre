import axios from 'axios';
const API_URL = 'http://localhost:5000/api';

async function testPost() {
  try {
    const res = await axios.post(`${API_URL}/posts`, { desc: 'Test without image' });
    console.log('Success:', res.status);
  } catch (err) {
    console.log('Error:', err.response?.status, err.response?.data);
  }
}
testPost();
