import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
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
  const { toast } = useToast();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'support@examsystem.com',
      description: 'Send us an email anytime'
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      description: '24/7 support available'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      content: '123 Education St, Tech City',
      description: 'Our headquarters'
    }
  ];

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
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <info.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                    <p className="text-blue-600 font-medium mb-1">{info.content}</p>
                    <p className="text-sm text-gray-600">{info.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

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
