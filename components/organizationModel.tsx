import * as React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface OrganizationModalProps {
  visible: boolean;
  onClose: () => void;
  organization: string;
}

const { width } = Dimensions.get('window');

const OrganizationModal = ({
  visible,
  onClose,
  organization,
}: OrganizationModalProps) => {
  // Placeholder data - will be replaced with API data later
  const orgData = {
    name: organization,
    type: 'University', // or 'Research Lab', 'Company', etc.
    location: 'Stanford, CA',
    description: 'A leading research institution focused on advancing artificial intelligence and machine learning research. The organization collaborates with industry partners and publishes groundbreaking research in top-tier conferences and journals.',
    recentPapers: [
      {
        title: 'Large Language Models for Scientific Discovery',
        authors: ['John Smith', 'Jane Doe'],
        year: 2024,
        category: 'cs.AI'
      },
      {
        title: 'Quantum Computing Applications',
        authors: ['Alice Johnson', 'Bob Wilson'],
        year: 2023,
        category: 'cs.ET'
      },
      {
        title: 'Machine Learning in Healthcare',
        authors: ['Sarah Brown', 'Mike Davis'],
        year: 2023,
        category: 'cs.LG'
      }
    ],
    associatedResearchers: [
      {
        name: 'Dr. John Smith',
        role: 'Professor',
        expertise: ['AI', 'Machine Learning']
      },
      {
        name: 'Dr. Jane Doe',
        role: 'Research Scientist',
        expertise: ['Deep Learning', 'NLP']
      },
      {
        name: 'Dr. Alice Johnson',
        role: 'Associate Professor',
        expertise: ['Quantum Computing', 'Physics']
      }
    ]
  };

  // Add cleanup effect
  React.useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      // Add any necessary cleanup here
    };
  }, []);

  // Add effect to handle modal visibility
  React.useEffect(() => {
    if (!visible) {
      // Reset any state if needed
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.organizationName}>{orgData.name}</Text>
                <View style={styles.typeTag}>
                  <Text style={styles.typeText}>{orgData.type}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="times" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.locationContainer}>
              <Icon name="map-marker" size={16} color="#6b7280" />
              <Text style={styles.locationText}>{orgData.location}</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{orgData.description}</Text>
            </View>

            {/* Recent Papers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Papers</Text>
              {orgData.recentPapers.map((paper, index) => (
                <View key={index} style={styles.paperItem}>
                  <Text style={styles.paperTitle}>{paper.title}</Text>
                  <Text style={styles.paperAuthors}>{paper.authors.join(', ')}</Text>
                  <View style={styles.paperMeta}>
                    <Text style={styles.paperYear}>{paper.year}</Text>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{paper.category}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Associated Researchers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Researchers</Text>
              {orgData.associatedResearchers.map((researcher, index) => (
                <View key={index} style={styles.researcherItem}>
                  <Text style={styles.researcherName}>{researcher.name}</Text>
                  <Text style={styles.researcherRole}>{researcher.role}</Text>
                  <View style={styles.expertiseContainer}>
                    {researcher.expertise.map((exp, idx) => (
                      <View key={idx} style={styles.expertiseTag}>
                        <Text style={styles.expertiseText}>{exp}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  organizationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  paperItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  paperAuthors: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  paperMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paperYear: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryTag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#4b5563',
  },
  researcherItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  researcherName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  researcherRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expertiseText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});

export default OrganizationModal;
