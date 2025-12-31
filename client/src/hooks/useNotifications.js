import { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';

export default function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const [expRes, stayRes, vacRes] = await Promise.all([
                fetch(`${API_URL}/dashboard/expiring-contracts`),
                fetch(`${API_URL}/dashboard/stay-alerts`),
                fetch(`${API_URL}/dashboard/vacation-alerts`)
            ]);

            let newNotifications = [];

            // 1. Contract Expiries
            if (expRes.ok) {
                const contracts = await expRes.json();
                if (Array.isArray(contracts)) {
                    contracts.forEach(emp => {
                        const isExpired = new Date(emp.contractEndDate) < new Date(new Date().setHours(0, 0, 0, 0));
                        newNotifications.push({
                            id: `contract-${emp.id}`,
                            type: 'contract',
                            severity: isExpired ? 'high' : 'medium',
                            title: 'تنبيه عقد',
                            message: isExpired
                                ? `انتهى عقد ${emp.firstName} ${emp.lastName}`
                                : `ينتهي عقد ${emp.firstName} ${emp.lastName} قريباً`,
                            date: emp.contractEndDate,
                            link: `/employees/${emp.id}`
                        });
                    });
                }
            }

            // 2. Residence Stay Alerts
            if (stayRes.ok) {
                const stays = await stayRes.json();
                if (Array.isArray(stays)) {
                    stays.forEach(emp => {
                        const fourMonthsMs = new Date(emp.fourMonthsDate).getTime();
                        const todayMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
                        const isOverdue = todayMs > fourMonthsMs;

                        newNotifications.push({
                            id: `stay-${emp.id}`,
                            type: 'residence',
                            severity: isOverdue ? 'high' : 'medium',
                            title: 'تنبيه إقامة',
                            message: `تجاوز ${emp.firstName} ${emp.lastName} مدة 4 أشهر`,
                            date: emp.fourMonthsDate,
                            link: `/employees/${emp.id}`
                        });
                    });
                }
            }

            // 3. Vacation Returns
            if (vacRes.ok) {
                const vacations = await vacRes.json();
                if (Array.isArray(vacations)) {
                    vacations.forEach(emp => {
                        newNotifications.push({
                            id: `vacation-${emp.id}`,
                            type: 'vacation',
                            severity: 'info',
                            title: 'عودة من أجازة',
                            message: `يعود ${emp.firstName} ${emp.lastName} من الأجازة قريباً`,
                            date: emp.vacationReturnDate,
                            link: `/employees/${emp.id}`
                        });
                    });
                }
            }

            // Sort by severity (high first) then date
            const sorted = newNotifications.sort((a, b) => {
                const sevPriority = { high: 3, medium: 2, info: 1 };
                if (sevPriority[b.severity] !== sevPriority[a.severity]) {
                    return sevPriority[b.severity] - sevPriority[a.severity];
                }
                return new Date(a.date) - new Date(b.date);
            });

            setNotifications(sorted);

            // Calculate unread count
            const storedReadIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
            const unread = sorted.filter(n => !storedReadIds.includes(n.id)).length;
            setUnreadCount(unread);

        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = () => {
        if (notifications.length === 0) return;

        const allIds = notifications.map(n => n.id);
        const storedReadIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');

        // Merge new IDs ensuring uniqueness
        const updatedReadIds = [...new Set([...storedReadIds, ...allIds])];

        localStorage.setItem('readNotificationIds', JSON.stringify(updatedReadIds));
        setUnreadCount(0);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    return { notifications, loading, unreadCount, markAllAsRead };
}
