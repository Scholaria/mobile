import * as React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  category: string;
  isFollowing: boolean;
  onConfirm: () => void;
}

const { width } = Dimensions.get('window');

const CategoriesModal = ({
  visible,
  onClose,
  category,
  isFollowing,
  onConfirm,
}: CategoriesModalProps) => {

  if (!visible) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { zIndex: 9999 }]}>
        <View style={[styles.modalContainer, { zIndex: 10000 }]}>
          <View style={styles.iconContainer}>
            <Icon
              name={isFollowing ? 'bookmark' : 'bookmark-o'}
              size={40}
              color="#3b82f6"
            />
          </View>
          
          <Text style={styles.title}>
            {isFollowing ? 'Unfollow Category' : 'Follow Category'}
          </Text>
          
          <Text style={styles.description}>
            {isFollowing
              ? `Would you like to unfollow "${category}"? You won't receive updates for this category anymore.`
              : `Would you like to follow "${category}"? You'll receive updates for papers in this category.`}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
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
    ...Platform.select({
      ios: {
        zIndex: 9999,
      },
      android: {
        elevation: 9999,
      },
    }),
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    ...Platform.select({
      ios: {
        zIndex: 10000,
      },
      android: {
        elevation: 10000,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CategoriesModal;
