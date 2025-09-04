import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/college');
      if (response.ok) {
        const data = await response.json();
        setColleges(data);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      // Fallback to default college data
      const defaultCollege = {
        _id: 'default',
        name: 'Patan Multiple Campus',
        address: 'Lalitpur, Nepal',
        phone: '9816944639',
        email: 'Adarshakd57@gmail.com',
        website: 'https://patanmultiplecampus.edu.np'
      };
      setColleges([defaultCollege]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToMap = () => {
    const mapElement = document.getElementById('interactive-map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `Subject: ${formData.subject}\n\n${formData.message}`
        }),
      });

      if (response.ok) {
        toast({
          title: "Message Sent Successfully! ✅",
          description: "Thank you for contacting us. We'll get back to you within 24 hours.",
          variant: "default",
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Send Message",
          description: errorData.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContactInfo = () => {
    const primaryCollege = colleges.length > 0 ? colleges[0] : null;
    
    return [
      {
        icon: Mail,
        title: 'Email Us',
        content: primaryCollege?.email || 'Adarshakd57@gmail.com',
        description: 'Send us an email anytime',
        isClickable: true,
        onClick: () => {
          const email = primaryCollege?.email || 'Adarshakd57@gmail.com';
          window.open(`mailto:${email}?subject=Inquiry about Online Examination System`, '_self');
          scrollToMap();
        }
      },
      {
        icon: Phone,
        title: 'Call Us',
        content: primaryCollege?.phone || '9816944639',
        description: '24/7 support available',
        isClickable: true,
        onClick: () => {
          const phone = primaryCollege?.phone || '9816944639';
          window.open(`tel:${phone}`, '_self');
          scrollToMap();
        }
      },
      {
        icon: MapPin,
        title: 'Visit Us',
        content: primaryCollege?.name || 'Patan Multiple Campus',
        description: 'Click to view on map',
        isClickable: true,
        onClick: scrollToMap
      }
    ];
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about our platform? We're here to help you get started 
            with your online examination needs.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-name" className="text-gray-700">Name</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email" className="text-gray-700">Email</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact-subject" className="text-gray-700">Subject</Label>
                <Input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="What's this about?"
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="contact-message" className="text-gray-700">Message</Label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us more about your needs..."
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </div>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <p className="text-gray-600 mb-8">
                We're always happy to help! Reach out to us through any of these channels 
                and we'll get back to you as soon as possible.
              </p>
            </div>

            <div className="space-y-6">
              {getContactInfo().map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
                    info.isClickable ? 'cursor-pointer hover:bg-blue-50' : ''
                  }`}
                  onClick={info.onClick}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <info.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                    <p className={`font-medium mb-1 ${
                      info.isClickable ? 'text-blue-600 hover:text-blue-800' : 'text-blue-600'
                    }`}>
                      {info.content}
                    </p>
                    <p className="text-sm text-gray-600">{info.description}</p>
                  </div>
                  {info.isClickable && (
                    <div className="flex-shrink-0">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Multiple Colleges Section */}
            {colleges.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  All Campus Locations
                </h4>
                <div className="space-y-3">
                  {colleges.map((college, index) => (
                    <motion.button
                      key={college._id}
                      onClick={() => {
                        // Trigger college selection in LocationSection
                        const event = new CustomEvent('selectCollege', { 
                          detail: { college } 
                        });
                        window.dispatchEvent(event);
                        scrollToMap();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                            {college.name}
                          </p>
                          <p className="text-sm text-gray-600">{college.address}</p>
                          {college.phone && (
                            <p className="text-xs text-gray-500">📞 {college.phone}</p>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FAQ Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Quick Answers
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Response Time:</span>
                  <span className="text-gray-600 ml-2">Usually within 2-4 hours</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Support Hours:</span>
                  <span className="text-gray-600 ml-2">24/7 for urgent issues</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Free Trial:</span>
                  <span className="text-gray-600 ml-2">30 days, no credit card required</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
