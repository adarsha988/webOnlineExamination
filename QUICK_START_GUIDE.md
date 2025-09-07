# 🚀 Quick Start Guide - Online Examination System

## 🎯 Getting Started in 3 Steps

### 1. **Start the System**
```bash
cd OnlineExamination
npm run dev
```
**System will be available at**: http://localhost:5000

### 2. **Login with Test Credentials**

#### 👨‍💼 **Admin Access**
```
Email: admin@university.edu
Password: password123
```
**Features**: User management, system analytics, reports, notifications

#### 👩‍🏫 **Instructor Access**
```
Email: sarah.johnson@university.edu
Password: password123
```
**Features**: Exam creation, question banks, student analytics, grading

#### 👨‍🎓 **Student Access**
```
Email: john.smith@student.edu
Password: password123
```
**Features**: Take exams, view results, personal analytics, notifications

### 3. **Test Key Workflows**

#### ✅ **Admin Workflow**
1. Login as Admin → `/admin/dashboard`
2. Create new users → User Management section
3. View system analytics → `/analytics`
4. Send notifications → Notifications page

#### ✅ **Instructor Workflow**
1. Login as Instructor → `/instructor/dashboard`
2. Create new exam → Exam Creation wizard
3. Assign to students → Student selection
4. View analytics → `/analytics`

#### ✅ **Student Workflow**
1. Login as Student → `/student/dashboard`
2. View available exams → Dashboard cards
3. Take exam → Click "Start Exam"
4. View results → Results section

---

## 📊 Pre-loaded Test Data

### **Users Ready to Use:**
- **1 Admin**: System administrator
- **3 Instructors**: Subject matter experts
- **5 Students**: Test exam takers

### **Sample Content:**
- **8 Questions**: Mixed subjects (CS, Math, Physics)
- **3 Exams**: Past completed, upcoming, draft
- **3 Student Records**: Realistic exam submissions
- **5 Notifications**: Cross-role messaging
- **2 Question Banks**: Shared collaborative sets

---

## 🔄 **End-to-End Test Scenarios**

### **Scenario 1: Complete Exam Flow**
1. **Admin** creates new student
2. **Instructor** creates exam and assigns to student
3. **Student** receives notification and takes exam
4. **Instructor** publishes results
5. **Student** views results and analytics update

### **Scenario 2: Analytics & Reporting**
1. Login as any role
2. Navigate to `/analytics`
3. View role-specific dashboards
4. Export reports (CSV/PDF)
5. Compare cross-role data consistency

### **Scenario 3: Notification System**
1. **Admin** sends system-wide notification
2. **Instructor** sends targeted student message
3. Users receive real-time notifications
4. Test mark as read/unread functionality
5. Verify deep linking to relevant pages

---

## 🛠️ **Technical Stack**

### **Backend**
- Node.js + Express + TypeScript
- MongoDB + Mongoose ODM
- JWT Authentication
- bcrypt Password Hashing

### **Frontend**
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts for Analytics
- Wouter for Routing
- Framer Motion for Animations

### **Database**
- MongoDB (Local: `mongodb://localhost:27017/online_examination`)
- 8 Collections with proper relationships
- Comprehensive indexing for performance

---

## 🔧 **Development Commands**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Database reset (if needed)
# Stop server, restart to trigger re-seeding
```

---

## 📱 **Key Features to Test**

### **✅ Authentication & Authorization**
- Role-based login/logout
- Protected route access
- JWT token management

### **✅ User Management (Admin)**
- Create/edit/delete users
- Role assignment
- Status management

### **✅ Exam Management (Instructor)**
- Question bank operations
- Exam creation wizard
- Student assignment
- Result publishing

### **✅ Exam Taking (Student)**
- Real-time exam interface
- Auto-save functionality
- Timer management
- Result viewing

### **✅ Analytics (All Roles)**
- Role-aware dashboards
- Interactive charts
- Data export
- Performance metrics

### **✅ Notifications (All Roles)**
- Real-time delivery
- Role-based targeting
- Mark as read/unread
- Deep linking

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Port Already in Use**
```bash
# Kill process on port 5000
npx kill-port 5000
npm run dev
```

#### **Database Connection Issues**
- Ensure MongoDB is running locally
- Check connection string in console logs
- Restart MongoDB service if needed

#### **Login Issues**
- Use exact credentials provided above
- Clear browser localStorage if needed
- Check network tab for API errors

#### **Missing Data**
- Server automatically seeds on startup
- Check console for seeding success messages
- Restart server to trigger re-seeding

---

## 📞 **Support**

### **System Status**
- ✅ All APIs functional
- ✅ Database fully populated
- ✅ Authentication working
- ✅ Real-time features active

### **Quick Verification**
1. Check server console for "✅ Comprehensive seed data created successfully!"
2. Verify login works for all three roles
3. Test navigation between dashboards
4. Confirm notifications appear in bell icon

---

**🎉 System is Production Ready - Start Testing! 🎉**

*Last Updated: September 7, 2025*
