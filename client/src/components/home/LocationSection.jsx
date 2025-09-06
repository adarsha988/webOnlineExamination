import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';

const LocationSection = () => {
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColleges();

    // Listen for college selection events from ContactSection
    const handleCollegeSelection = (event) => {
      const { college } = event.detail;
      setSelectedCollege(college);
      
      // Highlight map after a short delay
      setTimeout(() => {
        const mapElement = document.getElementById('interactive-map');
        if (mapElement) {
          mapElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            mapElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
          }, 2000);
        }
      }, 500);
    };

    window.addEventListener('selectCollege', handleCollegeSelection);

    return () => {
      window.removeEventListener('selectCollege', handleCollegeSelection);
    };
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/college');
      if (response.ok) {
        const data = await response.json();
        setColleges(data);
        if (data.length > 0) {
          setSelectedCollege(data[0]); // Set first college as default
        }
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      // Fallback to default college data
      const defaultCollege = {
        _id: 'default',
        name: 'Patan Multiple Campus',
        address: 'Lalitpur, Nepal',
        coordinates: { lat: 27.69287908279441, lng: 85.31398931506282 },
        phone: '9816944639',
        email: 'Adarshakd57@gmail.com',
        website: 'https://patanmultiplecampus.edu.np'
      };
      setColleges([defaultCollege]);
      setSelectedCollege(defaultCollege);
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeClick = (college) => {
    setSelectedCollege(college);
    // Smooth scroll to map with highlighting effect
    const mapElement = document.getElementById('interactive-map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlighting effect
      mapElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        mapElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
  };

  const generateMapUrl = (college) => {
    // Return null to disable Google Maps embed and avoid CSP/blocking issues
    return null;
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-4xl font-bold text-gray-900">Find Us</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Visit our campus or get in touch with us. We're here to help you succeed.
          </p>
        </motion.div>

        {/* College Selection */}
        {colleges.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Our Campus Locations</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {colleges.map((college) => (
                  <motion.button
                    key={college._id}
                    onClick={() => handleCollegeClick(college)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                      selectedCollege?._id === college._id
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 hover:shadow-md'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{college.name}</span>
                    {college.website && (
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div id="interactive-map" className="h-96 w-full relative transition-all duration-300 rounded-t-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
              {selectedCollege && (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedCollege.name}</h3>
                    <p className="text-gray-600 mb-4">{selectedCollege.address}</p>
                    <div className="space-y-2">
                      {selectedCollege.coordinates && (
                        <p className="text-sm text-gray-500">
                          📍 {selectedCollege.coordinates.lat}, {selectedCollege.coordinates.lng}
                        </p>
                      )}
                      {selectedCollege.website && (
                        <a
                          href={selectedCollege.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              
            </div>
            <div className="p-6">
              {selectedCollege ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedCollege.name}</h3>
                    {selectedCollege.website && (
                      <a
                        href={selectedCollege.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    {selectedCollege.address}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Our Campus</h3>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    Loading location...
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Address</h4>
                    {selectedCollege ? (
                      <button
                        onClick={() => handleCollegeClick(selectedCollege)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline text-left"
                      >
                        <p>{selectedCollege.name}</p>
                        <p>{selectedCollege.address}</p>
                      </button>
                    ) : (
                      <>
                        <p className="text-gray-600">Patan Multiple Campus</p>
                        <p className="text-gray-600">Lalitpur, Nepal</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Phone</h4>
                    <p className="text-gray-600">
                      {selectedCollege?.phone || '9816944639'}
                    </p>
                    <p className="text-sm text-gray-500">Available 24/7</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">
                      {selectedCollege?.email || 'Adarshakd57@gmail.com'}
                    </p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Office Hours</h4>
                    <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                    <p className="text-gray-600">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Why Choose Us?</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">10+</div>
                  <div className="text-sm text-blue-100">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">5000+</div>
                  <div className="text-sm text-blue-100">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">100+</div>
                  <div className="text-sm text-blue-100">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-blue-100">Support</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
