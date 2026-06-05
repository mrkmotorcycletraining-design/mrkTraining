We need to now work on scheduling logic now. 
Refer DataModel.md java models to understand dB schema.

We hava DB in PostGres, Banckend on Spring Boot and Frontend on Angular.

Logic here is, that Admin and trainer have rights to schdule/confirm the schedule the client requested.
Every Trainer can take more than 1 client on same branch with different asset at same time.

We do miss 1 table here which is for the purpose when client request for schedule.

Our first landing page should be a login page. Base upon the login type UI functionalities differs.

**Menu:

**When Client logins
 - Profile(New Separate future spec)
    - View/Update Profile
 - Trainings
    - Apply New Training
    - View Past Trainings
    - View Training Request Status
 - Schedule
    - See current schedule
    - Request Absence
    - Request Pause on current training

**When Trainer login(Every tab is Separate future spec):
- Profile(New Separate future spec)
    - View/Update Profile
- Schedule
    - See current schedule
    - Request Absence
    - Add new slots
    - Remove Existing slots

**Admin and SuperAdmin:
- Schedule
    - See current schedule
    - View Requests
    - Set schedule for Client
    - Set schedule for Trainer
- Client
    - Add client
    - Mark Absent
    - Pause Training
    - Update client password
    - Delete client
    - Deactivate client
- Trainer(Future Spec)
    - Add Trainer(Only Super Adming, will be in different Spec)
    - Mark Absence
    - Switch Trainer branch
    - Update Trainer password
    - Delete Trainer
    - Deactivate Trainer
- Site Management
    - Add New Branch
    - Update Training Template
    - Add New Training

** Training Requirement
Every training has
Category: Regular/Premium/Trip/Other
Regular and Premium have type: Basic/Advance/Traffic/Other(User/AdminInput Optional)
Other: This is custom training. Admin or SuperAdmin can design questions for this. This will be separate spec.
But each category-type comb, trip and other will have a template, which is an image type
Also, for each training, we have an optional column, BufferDays. Mostly it applies to Regular/Premium to have a cushion in case client or trainer took a leave, while booking these many slots we overbooked for same client trainer and vehicle.


** Trainer Branch Availability
    This requirement is missing in data model. We need a table and UI. Trainer can handle different branches at different times. Constraint: Same trainer cannot be part of 2 tranches at same time and there should be at least 30mins difference in slots for trainner for different branch. In case of premium courses, BranchId can be clients location picode.
    For Trip course, it can be trip id

    Requirement: Trainer/Admin/SuperAdmin can add slots for trainer in branch.
    Table structure1: TrainerId, BranchId, AvailableSlots, AvailableDays, MaxClientsInSameTimeSlot, startDate, endDate, auditStartDateTime, auditUserId
    Avaiable slots is time ranges, example 01:00PM-03:00PM
    Avaialble Days: comman separated Mo, Tu, WE, Th, Fr, Sa, Su
    BranchId: This is not foreign key, as for premium courses, BranchId can be clients location picode

    In case lets say trainer selected 1st May to 30th June 1Pm-4Pm but later adds schedule
    20th May-21st May 4PM-6PM, then latest auditStartDateTime one should always get priority.
    In case trainer request absence for 1st june, Add entry for that whole day with AvailableSlots 0


** Client Onboarding Logic
    Only Admin and SuperAdmin has right to onboard new client. Admin can provide client name, userName, uniqueId, allowedNumOfTrainings and password. Then through separate channels, admin will share these details for client to login. UniqueId and Username, we should have a check to confirm if its unique or not. Its upto Admin to decide whats unique id is. Admin can use email or anything else. There's one column missing in client table which is allowedNumOfTrainings. Only Admin and subAdmin can provide how many trainig client can opt for at a time. allowedNumOfTrainings Admin and superAdmin can increase and decrease anytime.

    Once Client login, they can see their profile. They can change their password. They can add pic if they want and can provide ht, wt and dob. Pic, Password, height and weight client can update any no. of time they want. Name, UserName, allowedNumOfTrainings, UniqueId are admin provided only. UniqueId and allowedNumOfTrainings is not visible to client.

** Client Training Apply New Training
    Client can only apply for the training if their profile status is ACTIVE and allowedNumOfTrainings > 1. Once client completes a training
    In this component, we will fetch all Training category templates(template are img, future spec)
    On below we give user a form: 
        - Choose Training Category
            - If Category == Regular/Premium
                - Choose Training type
                - Choose Vehicle type(Asset Type)
                - In case of premium: 
                    -Train on your own vehicle:Yes/No
                    - If Yes
                        - Provide vehicle Number
                        - Registration Certification available
                        - Insurance available
                        - PUC available
                        - Any issues in vehicle(id not applicable, please enter N/A)
                - Choose Location: In regular Branch dropDown, in Premium, complete address
                - Then we use the calender component month view restricted, for current month, show them the for selected vehicle and branch, which slots are available, which are already taken with red and green colors. For this we need an API which takes month, branchId, vehicleType as request param, compute available and occupied time base upon trainerBranchAvailability and scheduleSlots tables.
                While computing, buffered time for existing training should also be considered as already occupied time. And from scheduleSlots table, it should consider only the entries grt than current date and have status ACTIVE and Pending.
                The response object should contains 2 objects: Tasks[] and ScheduleDetail.
                Tasks is available slots in format that we have created for calender component. ScheduleDetail is a complex object that contians complete details in granular level, for example which trainer is available with what capacity(MaxClientsInSameTimeSlot - currentClientsAtThatTime) from what time range. Now this is useful for next question. Also, for same bike we would like to have 30mins buffer time. Means if for metor trainer is available from 1-4 and there was a schedule for 1-2, then avaible slot should be from 2:30-4. But if branch has more than 1 metor, then it can be 1-4 if another metor is not been occupied. Now when user click next month, again same API is called. I understand this is quite heavy operation, and open for suggestion to optamize it. I am thinking of coputing for 3 months together.
                - Select start date: this should always start from Monday. Admin/SuperAdmin can update it on confirmation. Below this show a note: Every new training ususally starts from Monday. Its highley recommended to select the starting date from Monday, unless you are opting for special training like weekend only. In case of any doubt, please check with Rohan Matre:"Contact Number"
                - Select start and end Time: Now for training. Now here comes the use of ScheduleDetail object usage. Suppose trainer1 is available from 1-2 and trainer2 is available from 2-3 and user chooses 1:30-2:30. It should prompt that for selected time, no individual trainer availbale, please choose another time. Client should not be able to see trainer details.
                - Number of Training days
                - Number of hours per day
                - Days you like to opt for training Mo, Tu, We,..
                - Base upon above info we calculate(Client Only):
                    -- Buffer Time computations: Every course has bufferDay, while booking, we should add that same number of days. This should not be vsisble to client. 
                    -- If its not weekend specific training, does it starts from Mo or not. If show error dialogue box asking to select date from Monday only, or contact Rohan Matre
                    -- If for all the specified days, from start date to end date(including buffer) for given number of hours/perDay, same trainer and vehicle available or not. If not again similar error dialogue.                    
                    -- If everything is good, show success dialgue that training is available
                This should create an entry in scheduleSlot table with status pending, send notification email to admins and client. Admin/SuperAdmin can approve it or reject it.
            - If Category == Trip
                - Choose trip: dropdown for all courses name with category Trip
                This should create an entry in trainingRequest table, send notification email to admins and client.
            - If Category == Other
                - Follow User based question(Future Spec)
    After each book, even if status in pending, allowedNumOfTrainings shoud be reduce by 1

** Admin/SuperAdmin creating schedule on behalf of client
Almost whole process remains same exept for the (Client Only Section). In prev one we said error box should not allow you to book, but in case of admin they can book it, in this case it should be warning box. Also, in case of admins, on warning box should also provide trainers names, vehicles infos to give them for info.

** Admin/SuperAdmin Login
When Admin/SuperAdmin Login, they will see the calender component with for the default branch. They have filter to change branch. They have lot more filters. They could select he customer(dropdown userName-Name format), They could see for given vehicle type schedule and vehicle id schedule. They could see trainer schedule. Mix and match of all these.

Then the schedule Menu item should show a red dot if the scheduleSlots Table has Pending requests. If they hover/click on schedule, in sub menu=>View Requests should also have red dot. This should route to separate component which uses ag-grid to show all the requests pending. Available bikes and trainer should be drop downs. 
Now whenever Admin/SuperAdmin Approves status should become ACTIVE. If reject, they can provide optional reason. It should notify client on email and should be visible on clinets
"View Training Request Status" ag grid, if reason provided, that column should be visible, else not.