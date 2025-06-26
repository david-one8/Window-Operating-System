// Calendar Application
class CalendarApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.selectedDate = null;
        this.viewMode = 'month'; // 'month', 'week', 'day'
        this.realTimeEnabled = true;
        this.clockInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.renderCalendar();
        this.startRealTimeClock();
    }

    render() {
        this.container.innerHTML = `
            <div class="calendar-app">
                <div class="calendar-header">
                    <div class="calendar-nav">
                        <button class="nav-btn" id="prevBtn">⬅️</button>
                        <button class="nav-btn" id="nextBtn">➡️</button>
                        <button class="nav-btn" id="todayBtn">Today</button>
                    </div>
                    
                    <div class="calendar-title" id="calendarTitle">
                        ${this.getMonthYearString()}
                    </div>
                    
                    <div class="real-time-display">
                        <div class="current-time" id="currentTime">
                            ${this.getCurrentTime()}
                        </div>
                        <div class="current-date" id="currentDate">
                            ${this.getCurrentDateString()}
                        </div>
                    </div>
                    
                    <div class="calendar-actions">
                        <div class="calendar-status">
                            <div class="status-indicator"></div>
                            <span>Live</span>
                        </div>
                        <div class="view-toggle">
                            <button class="view-btn ${this.viewMode === 'month' ? 'active' : ''}" data-view="month">Month</button>
                            <button class="view-btn ${this.viewMode === 'week' ? 'active' : ''}" data-view="week">Week</button>
                            <button class="view-btn ${this.viewMode === 'day' ? 'active' : ''}" data-view="day">Day</button>
                        </div>
                        <button class="nav-btn" id="newEventBtn">+ Event</button>
                    </div>
                </div>
                
                <div class="calendar-content">
                    <div id="calendarGrid" class="calendar-grid">
                        <!-- Calendar will be rendered here -->
                    </div>
                </div>
                
                <!-- Event Modal -->
                <div class="modal-overlay hidden" id="eventModal">
                    <div class="modal">
                        <div class="modal-header">
                            <h3 id="modalTitle">New Event</h3>
                            <button class="modal-close" id="modalClose">×</button>
                        </div>
                        <div class="modal-content">
                            <form id="eventForm">
                                <div class="form-group">
                                    <label for="eventTitle">Title</label>
                                    <input type="text" id="eventTitle" required>
                                </div>
                                <div class="form-group">
                                    <label for="eventDate">Date</label>
                                    <input type="date" id="eventDate" required>
                                </div>
                                <div class="form-group">
                                    <label for="eventTime">Time</label>
                                    <input type="time" id="eventTime">
                                </div>
                                <div class="form-group">
                                    <label for="eventDescription">Description</label>
                                    <textarea id="eventDescription" rows="3"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="eventColor">Color</label>
                                    <select id="eventColor">
                                        <option value="blue">Blue</option>
                                        <option value="green">Green</option>
                                        <option value="red">Red</option>
                                        <option value="purple">Purple</option>
                                        <option value="orange">Orange</option>
                                        <option value="teal">Teal</option>
                                    </select>
                                </div>
                                <div class="form-actions">
                                    <button type="button" id="deleteEventBtn" class="btn-danger" style="display: none;">Delete</button>
                                    <button type="button" id="cancelBtn" class="btn-secondary">Cancel</button>
                                    <button type="submit" id="saveBtn" class="btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Navigation
        this.container.querySelector('#prevBtn').addEventListener('click', () => this.previousPeriod());
        this.container.querySelector('#nextBtn').addEventListener('click', () => this.nextPeriod());
        this.container.querySelector('#todayBtn').addEventListener('click', () => this.goToToday());

        // View toggle
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setViewMode(btn.dataset.view));
        });

        // New event
        this.container.querySelector('#newEventBtn').addEventListener('click', () => this.openEventModal());

        // Modal
        this.container.querySelector('#modalClose').addEventListener('click', () => this.closeEventModal());
        this.container.querySelector('#cancelBtn').addEventListener('click', () => this.closeEventModal());
        this.container.querySelector('#eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') this.closeEventModal();
        });

        // Form
        this.container.querySelector('#eventForm').addEventListener('submit', (e) => this.handleEventSubmit(e));
        this.container.querySelector('#deleteEventBtn').addEventListener('click', () => this.deleteCurrentEvent());
    }

    renderCalendar() {
        const grid = this.container.querySelector('#calendarGrid');
        
        if (this.viewMode === 'month') {
            this.renderMonthView(grid);
        } else if (this.viewMode === 'week') {
            this.renderWeekView(grid);
        } else if (this.viewMode === 'day') {
            this.renderDayView(grid);
        }
    }

    renderMonthView(grid) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        
        // Get first day of month and calculate starting date
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Get days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalDays = 42; // 6 weeks * 7 days
        
        let html = `
            <div class="calendar-weekdays">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
            </div>
            <div class="calendar-days">
        `;
        
        for (let i = 0; i < totalDays; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dayNumber = currentDay.getDate();
            const isCurrentMonth = currentDay.getMonth() === month;
            const isToday = this.isSameDay(currentDay, today);
            const isSelected = this.selectedDate && this.isSameDay(currentDay, this.selectedDate);
            
            const dayEvents = this.getEventsForDate(currentDay);
            const dayKey = this.formatDateKey(currentDay);
            
            let classes = ['calendar-day'];
            if (!isCurrentMonth) classes.push('other-month');
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            
            html += `
                <div class="${classes.join(' ')}" data-date="${dayKey}">
                    <div class="calendar-day-number">${dayNumber}</div>
                    <div class="calendar-events">
                        ${dayEvents.slice(0, 3).map(event => {
                            const eventStatus = this.getEventStatus(event);
                            return `<div class="calendar-event ${event.color} ${eventStatus}" data-event-id="${event.id}" title="${event.title}${event.time ? ' at ' + event.time : ''}">
                                ${event.title}
                            </div>`;
                        }).join('')}
                        ${dayEvents.length > 3 ? `<div class="more-events">+${dayEvents.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        grid.innerHTML = html;
        
        // Add click handlers
        grid.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                if (!e.target.classList.contains('calendar-event')) {
                    this.selectDate(day.dataset.date);
                }
            });
            
            day.addEventListener('dblclick', () => {
                this.openEventModal(day.dataset.date);
            });
        });
        
        grid.querySelectorAll('.calendar-event').forEach(event => {
            event.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editEvent(event.dataset.eventId);
            });
        });
    }

    renderWeekView(grid) {
        // Week view implementation
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        
        let html = `
            <div class="week-view">
                <div class="week-header">
                    ${days.map(day => `
                        <div class="week-day-header">
                            <div class="week-day-name">${day.toLocaleDateString('en', {weekday: 'short'})}</div>
                            <div class="week-day-number ${this.isSameDay(day, new Date()) ? 'today' : ''}">${day.getDate()}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="week-content">
                    ${days.map(day => `
                        <div class="week-day" data-date="${this.formatDateKey(day)}">
                            ${this.getEventsForDate(day).map(event => `
                                <div class="week-event ${event.color}" data-event-id="${event.id}">
                                    <div class="event-time">${event.time || ''}</div>
                                    <div class="event-title">${event.title}</div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        grid.innerHTML = html;
        this.setupWeekEventListeners(grid);
    }

    renderDayView(grid) {
        // Day view implementation
        const today = this.currentDate;
        const events = this.getEventsForDate(today);
        
        let html = `
            <div class="day-view">
                <div class="day-header">
                    <h2>${today.toLocaleDateString('en', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</h2>
                    <button class="add-event-btn" data-date="${this.formatDateKey(today)}">+ Add Event</button>
                </div>
                <div class="day-events">
                    ${events.length === 0 ? `
                        <div class="no-events">
                            <div class="no-events-icon">📅</div>
                            <div>No events scheduled for this day</div>
                        </div>
                    ` : events.map(event => `
                        <div class="day-event ${event.color}" data-event-id="${event.id}">
                            <div class="event-time">${event.time || 'All day'}</div>
                            <div class="event-details">
                                <div class="event-title">${event.title}</div>
                                ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        grid.innerHTML = html;
        this.setupDayEventListeners(grid);
    }

    setupWeekEventListeners(grid) {
        grid.querySelectorAll('.week-day').forEach(day => {
            day.addEventListener('dblclick', () => {
                this.openEventModal(day.dataset.date);
            });
        });
        
        grid.querySelectorAll('.week-event').forEach(event => {
            event.addEventListener('click', () => {
                this.editEvent(event.dataset.eventId);
            });
        });
    }

    setupDayEventListeners(grid) {
        const addBtn = grid.querySelector('.add-event-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openEventModal(addBtn.dataset.date);
            });
        }
        
        grid.querySelectorAll('.day-event').forEach(event => {
            event.addEventListener('click', () => {
                this.editEvent(event.dataset.eventId);
            });
        });
    }

    selectDate(dateKey) {
        this.selectedDate = this.parseDate(dateKey);
        
        // Update visual selection
        this.container.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.toggle('selected', day.dataset.date === dateKey);
        });
    }

    openEventModal(dateKey = null) {
        const modal = this.container.querySelector('#eventModal');
        const form = this.container.querySelector('#eventForm');
        const title = this.container.querySelector('#modalTitle');
        const deleteBtn = this.container.querySelector('#deleteEventBtn');
        
        // Reset form
        form.reset();
        this.currentEventId = null;
        
        // Set date if provided
        if (dateKey) {
            const date = this.parseDate(dateKey);
            this.container.querySelector('#eventDate').value = this.formatDateInput(date);
        } else if (this.selectedDate) {
            this.container.querySelector('#eventDate').value = this.formatDateInput(this.selectedDate);
        } else {
            this.container.querySelector('#eventDate').value = this.formatDateInput(new Date());
        }
        
        title.textContent = 'New Event';
        deleteBtn.style.display = 'none';
        modal.classList.remove('hidden');
        
        // Focus title input
        this.container.querySelector('#eventTitle').focus();
    }

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const modal = this.container.querySelector('#eventModal');
        const form = this.container.querySelector('#eventForm');
        const title = this.container.querySelector('#modalTitle');
        const deleteBtn = this.container.querySelector('#deleteEventBtn');
        
        // Populate form
        this.container.querySelector('#eventTitle').value = event.title;
        this.container.querySelector('#eventDate').value = event.date;
        this.container.querySelector('#eventTime').value = event.time || '';
        this.container.querySelector('#eventDescription').value = event.description || '';
        this.container.querySelector('#eventColor').value = event.color;
        
        this.currentEventId = eventId;
        title.textContent = 'Edit Event';
        deleteBtn.style.display = 'block';
        modal.classList.remove('hidden');
    }

    closeEventModal() {
        const modal = this.container.querySelector('#eventModal');
        modal.classList.add('hidden');
        this.currentEventId = null;
    }

    handleEventSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const eventData = {
            id: this.currentEventId || 'event_' + Date.now(),
            title: this.container.querySelector('#eventTitle').value,
            date: this.container.querySelector('#eventDate').value,
            time: this.container.querySelector('#eventTime').value,
            description: this.container.querySelector('#eventDescription').value,
            color: this.container.querySelector('#eventColor').value,
            created: this.currentEventId ? undefined : Date.now(),
            modified: Date.now()
        };
        
        if (this.currentEventId) {
            // Update existing event
            const index = this.events.findIndex(e => e.id === this.currentEventId);
            if (index !== -1) {
                this.events[index] = { ...this.events[index], ...eventData };
                this.showNotification('Event updated successfully', 'success');
            }
        } else {
            // Create new event
            this.events.push(eventData);
            this.showNotification('Event created successfully', 'success');
        }
        
        this.saveEvents();
        this.renderCalendar();
        this.closeEventModal();
    }

    deleteCurrentEvent() {
        if (!this.currentEventId) return;
        
        if (confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(e => e.id !== this.currentEventId);
            this.saveEvents();
            this.renderCalendar();
            this.closeEventModal();
            this.showNotification('Event deleted successfully', 'success');
        }
    }

    previousPeriod() {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else if (this.viewMode === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else if (this.viewMode === 'day') {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
        }
        
        this.updateTitle();
        this.renderCalendar();
    }

    nextPeriod() {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else if (this.viewMode === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        } else if (this.viewMode === 'day') {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
        }
        
        this.updateTitle();
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateTitle();
        this.renderCalendar();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update button states
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        this.updateTitle();
        this.renderCalendar();
    }

    updateTitle() {
        const title = this.container.querySelector('#calendarTitle');
        
        if (this.viewMode === 'month') {
            title.textContent = this.getMonthYearString();
        } else if (this.viewMode === 'week') {
            const startOfWeek = this.getStartOfWeek(this.currentDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            title.textContent = `${startOfWeek.toLocaleDateString('en', {month: 'short', day: 'numeric'})} - ${endOfWeek.toLocaleDateString('en', {month: 'short', day: 'numeric', year: 'numeric'})}`;
        } else if (this.viewMode === 'day') {
            title.textContent = this.currentDate.toLocaleDateString('en', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
        }
    }

    getEventsForDate(date) {
        const dateKey = this.formatDateKey(date);
        return this.events.filter(event => event.date === this.formatDateInput(date));
    }

    getEventStatus(event) {
        if (!event.time) return '';
        
        const now = new Date();
        const eventDate = new Date(event.date + 'T' + event.time + ':00');
        const eventEndDate = new Date(eventDate.getTime() + (60 * 60 * 1000)); // Assume 1 hour duration if no end time
        
        const timeDiff = eventDate.getTime() - now.getTime();
        const isHappeningNow = now >= eventDate && now <= eventEndDate;
        const isUpcomingSoon = timeDiff > 0 && timeDiff <= (30 * 60 * 1000); // Next 30 minutes
        
        if (isHappeningNow) {
            return 'happening-now';
        } else if (isUpcomingSoon) {
            return 'upcoming-soon';
        }
        
        return '';
    }

    getMonthYearString() {
        return this.currentDate.toLocaleDateString('en', {year: 'numeric', month: 'long'});
    }

    getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        return start;
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateInput(date) {
        return date.toISOString().split('T')[0];
    }

    parseDate(dateKey) {
        return new Date(dateKey + 'T00:00:00');
    }

    loadEvents() {
        let events = window.storage.get('calendar_events', []);
        
        // Add some sample events if none exist
        if (events.length === 0) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            
            events = [
                {
                    id: 'sample_1',
                    title: 'Team Meeting',
                    date: this.formatDateInput(today),
                    time: '10:00',
                    description: 'Weekly team sync meeting',
                    color: 'blue',
                    created: Date.now()
                },
                {
                    id: 'sample_2',
                    title: 'Project Deadline',
                    date: this.formatDateInput(tomorrow),
                    time: '17:00',
                    description: 'Final submission for the project',
                    color: 'red',
                    created: Date.now()
                },
                {
                    id: 'sample_3',
                    title: 'Doctor Appointment',
                    date: this.formatDateInput(nextWeek),
                    time: '14:30',
                    description: 'Regular checkup',
                    color: 'green',
                    created: Date.now()
                },
                {
                    id: 'sample_4',
                    title: 'Live Demo',
                    date: this.formatDateInput(today),
                    time: this.getTimeInMinutes(5), // 5 minutes from now
                    description: 'Real-time calendar demonstration',
                    color: 'purple',
                    created: Date.now()
                }
            ];
            
            // Save the sample events
            window.storage.set('calendar_events', events);
        }
        
        return events;
    }

    saveEvents() {
        window.storage.set('calendar_events', this.events);
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Calendar',
                message: message,
                type: type,
                icon: '🗓️'
            });
        }
    }

    // Real-time functionality
    startRealTimeClock() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        
        this.updateRealTimeDisplay();
        
        // Update every second
        this.clockInterval = setInterval(() => {
            this.updateRealTimeDisplay();
            this.checkForCurrentTimeIndicators();
        }, 1000);
    }

    stopRealTimeClock() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    updateRealTimeDisplay() {
        const currentTimeElement = this.container.querySelector('#currentTime');
        const currentDateElement = this.container.querySelector('#currentDate');
        
        if (currentTimeElement) {
            currentTimeElement.textContent = this.getCurrentTime();
        }
        
        if (currentDateElement) {
            currentDateElement.textContent = this.getCurrentDateString();
        }
    }

    checkForCurrentTimeIndicators() {
        const now = new Date();
        
        // Update today highlighting
        this.container.querySelectorAll('.calendar-day').forEach(day => {
            const dayDate = new Date(day.dataset.date + 'T00:00:00');
            const isToday = this.isSameDay(dayDate, now);
            
            day.classList.toggle('today', isToday);
            
            if (isToday) {
                day.classList.add('current-time');
                this.updateCurrentTimeIndicator(day, now);
            }
        });

        // Check for event notifications (upcoming events in next 15 minutes)
        this.checkUpcomingEventNotifications(now);
        
        // Auto-refresh calendar at midnight
        if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 2) {
            this.renderCalendar();
        }
    }

    updateCurrentTimeIndicator(todayElement, now) {
        // Remove existing time indicator
        const existingIndicator = todayElement.querySelector('.current-time-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Only show time indicator in day or week view for today
        if (this.viewMode === 'day' || this.viewMode === 'week') {
            const timeIndicator = document.createElement('div');
            timeIndicator.className = 'current-time-indicator';
            timeIndicator.innerHTML = `
                <div class="time-line"></div>
                <div class="time-dot"></div>
                <div class="time-label">${this.getCurrentTime()}</div>
            `;
            
            // Position based on current time (approximate)
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const totalMinutes = hours * 60 + minutes;
            const percentageOfDay = (totalMinutes / 1440) * 100; // 1440 minutes in a day
            
            timeIndicator.style.top = `${Math.min(percentageOfDay, 95)}%`;
            todayElement.style.position = 'relative';
            todayElement.appendChild(timeIndicator);
        }
    }

    checkUpcomingEventNotifications(now) {
        const upcomingThreshold = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        this.events.forEach(event => {
            const eventDate = new Date(event.date + 'T' + (event.time || '00:00:00'));
            const timeDiff = eventDate.getTime() - now.getTime();
            
            // Check if event is starting in 15 minutes (within 1 minute window)
            if (timeDiff > 0 && timeDiff <= upcomingThreshold && timeDiff >= (upcomingThreshold - 60000)) {
                this.showEventReminder(event);
            }
        });
    }

    showEventReminder(event) {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Upcoming Event',
                message: `"${event.title}" starts in 15 minutes`,
                type: 'warning',
                icon: '⏰',
                duration: 8000
            });
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
    }

    getCurrentDateString() {
        const now = new Date();
        return now.toLocaleDateString('en', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });
    }

    getCurrentWeek() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now - startOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    }

    getTimeInMinutes(minutesFromNow) {
        const now = new Date();
        const futureTime = new Date(now.getTime() + (minutesFromNow * 60 * 1000));
        return futureTime.toTimeString().slice(0, 5); // Returns HH:MM format
    }

    // Override the existing goToToday method to include real-time
    goToToday() {
        this.currentDate = new Date();
        this.updateTitle();
        this.renderCalendar();
        this.showNotification('Jumped to today', 'info');
    }

    // Cleanup method for when calendar is closed
    destroy() {
        this.stopRealTimeClock();
    }
}

// Register the app globally
window.CalendarApp = CalendarApp;