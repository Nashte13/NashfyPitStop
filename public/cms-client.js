// Sanity CMS Client for NashfyPitStop
class SanityClient {
  constructor() {
    // Replace these with your Sanity project details
    this.projectId = 'j5jgcp4i'; // Get from Sanity dashboard
    this.dataset = 'production'; // or 'development'
    this.apiVersion = '2024-01-01';
    // Using CDN endpoint for better CORS handling
    this.baseUrl = `https://${this.projectId}.apicdn.sanity.io/v${this.apiVersion}/data/query/${this.dataset}`;
    this.writeUrl = `https://${this.projectId}.api.sanity.io/v${this.apiVersion}/data/mutate/${this.dataset}`;
    this.writeToken = null; // Set this for form submissions (optional, can use serverless functions instead)
  }

  // Generic query method
  async query(groqQuery) {
    try {
      const url = `${this.baseUrl}?query=${encodeURIComponent(groqQuery)}`;
      console.log('🔵 Sanity API URL:', url);
      console.log('🔵 Query:', groqQuery);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add mode to handle CORS
        mode: 'cors',
        cache: 'no-cache'
      });
      
      console.log('🔵 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sanity API error response:', errorText);
        throw new Error(`Sanity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔵 Sanity API response:', data);
      return data.result;
    } catch (error) {
      console.error('❌ Error fetching from Sanity:', error);
      console.error('❌ Error type:', error.name);
      console.error('❌ Error message:', error.message);
      
      // Check if it's a CORS error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.error('❌ This might be a CORS issue. Check:');
        console.error('   1. Project ID is correct:', this.projectId);
        console.error('   2. Dataset name is correct:', this.dataset);
        console.error('   3. Sanity project allows CORS (should be enabled by default)');
      }
      
      throw error;
    }
  }

  // Get About Page content
  async getAboutPage() {
    const query = `*[_type == "aboutPage"][0]{
      title,
      description,
      mission,
      whatWeDo,
      whyKenya,
      joinMovement,
      values
    }`;
    return await this.query(query);
  }

  // Get all Watch Party Venues
  async getVenues() {
    const query = `*[_type == "venue"] | order(name asc){
      _id,
      name,
      location,
      city,
      description,
      capacity,
      amenities,
      "imageUrl": image.asset->url
    }`;
    return await this.query(query);
  }

  // Get NashfyPitStop News (Blog Posts)
  async getBlogPosts(type = null) {
    let query = `*[_type == "blogPost"] | order(date desc){
      _id,
      title,
      content,
      author,
      date,
      type,
      location,
      reactions
    }`;
    
    if (type) {
      query = `*[_type == "blogPost" && type == "${type}"] | order(date desc){
        _id,
        title,
        content,
        author,
        date,
        type,
        location,
        reactions
      }`;
    }
    
    return await this.query(query);
  }

  // Submit Join Club form (requires write token or serverless function)
  async submitJoinClubForm(formData) {
    if (!this.writeToken) {
      console.warn('Write token not set. Form submission requires serverless function or write token.');
      // For now, just log it - you'll need to set up a serverless function
      console.log('Form data:', formData);
      return { success: false, message: 'Form submission requires backend setup' };
    }

    try {
      const mutation = {
        mutations: [{
          create: {
            _type: 'clubMember',
            name: formData.name,
            email: formData.email,
            city: formData.city,
            submittedAt: new Date().toISOString(),
            status: 'pending'
          }
        }]
      };

      const response = await fetch(this.writeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.writeToken}`
        },
        body: JSON.stringify(mutation)
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting form:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in main.js
// Initialize with your project ID
const sanity = new SanityClient();

