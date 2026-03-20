import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get("/notification");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axiosInstance.put(`/notification/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const removeNotification = async (id: number) => {
    try {
      await axiosInstance.delete(`/notification/${id}`);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-white">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-600">Your Notifications</h1>
      
      {notifications.length === 0 ? (
        <div className="bg-[#2D2D2D] rounded-xl p-8 text-center text-gray-400">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-xl border transition-colors ${
                notification.is_read
                  ? "bg-[#2D2D2D]/50 border-gray-700/50"
                  : "bg-[#2D2D2D] border-green-500/30"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    notification.is_read ? "text-gray-300" : "text-white"
                  }`}>
                    {notification.title}
                  </h3>
                  <p className={`${
                    notification.is_read ? "text-white" : "text-gray-200"
                  }`}>
                    {notification.message}
                  </p>
                  <p className="text-sm text-white mt-3">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 ml-4">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors text-sm font-medium"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="px-3 py-1 bg-red-500/10 text-red-700 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
