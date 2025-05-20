import { StyleSheet } from 'react-native';

export const getNotificationStyles = (theme: 'light' | 'dark') => StyleSheet.create({
  bellContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 99,
  },
  bellButton: {
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  // 建議於元件中根據 theme 覆蓋 backgroundColor
  notificationDropdown: {
    position: 'absolute',
    top: 48,
    right: 8,
    width: 260,
    maxHeight: 480, // 展示框更長
    backgroundColor: '#fff', // 預設白色，深色模式時於元件中覆蓋
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    padding: 10,
    zIndex: 200,
  },
  notificationItem: {
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: theme === 'dark' ? '#e0e0e0' : '#222',
  },
  notificationBody: {
    fontSize: 13,
    color: theme === 'dark' ? '#cccccc' : '#444',
    marginTop: 2,
    flexWrap: 'wrap',
    flexShrink: 1,
    width: '100%',
    lineHeight: 18,
  },
  notificationTimestamp: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    textAlign: 'right',
  },
  markAllAsRead: {
    marginTop: 6,
    alignSelf: 'flex-end',
    padding: 6,
    backgroundColor: '#e67e22',
    borderRadius: 6,
  },
  markAllText: {
    color: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

