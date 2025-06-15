from django.urls import path
from .views import AllEducationsView, AllMedicalExamView, CustomLoginView, CustomLogoutView, CustomPasswordChangeView, EduAddView, EduDeleteView, EduUpdateView, EmployeeAddView, EmployeeDeleteView, EmployeeFilterView, EmployeeSearch, EmployeeUpdateView, FileDeleteView, FileListView, FilePreviewView, FileUploadView, ForbiddenView, GetCurentUserDetails, GetEducationView, GetMedicalExamView, IndexView, MedDeleteView, MedicalDirectionView, MedicalExamAddView, MedicalExamUpdateView, NotificationListView, logout_confirmation_view, get_worker_FIO, get_worker_med, get_worker_education

app_name = 'guard'

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout-confirm/', logout_confirmation_view, name='logout-confirm'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('change-pass/', CustomPasswordChangeView.as_view(), name='change-pass'),
    path('', IndexView.as_view(), name='index'),
    path('worker/personal/FIO/<int:worker_id>', get_worker_FIO, name='FIO'),
    path('worker/personal/update/<int:worker_id>', EmployeeUpdateView.as_view(), name='personal-update'),
    path('med/', AllMedicalExamView.as_view(), name='all-med'),
    path('education/', AllEducationsView.as_view(), name='all-edu'),
    path('education/<int:edu_id>', GetEducationView.as_view(), name='edu-by-id'),
    path('worker/med/<int:worker_id>', get_worker_med, name='med'),
    path('med/<int:med_id>', GetMedicalExamView.as_view(), name='med-by-id'),
    path('med/update/<int:med_id>', MedicalExamUpdateView.as_view(), name="med-update"),
    path('med/delete/', MedDeleteView.as_view(), name="med-delete"),
    path('education/update/<int:education_id>', EduUpdateView.as_view(), name="edu-update"),
    path('education/delete/', EduDeleteView.as_view(), name="edu-delete"),
    path('worker/med/add', MedicalExamAddView.as_view(), name='med-add'),
    path('worker/education/<int:worker_id>', get_worker_education, name='worker-educations'),
    path('worker/education/add', EduAddView.as_view(), name='education-add'),
    path('worker/filter/', EmployeeFilterView.as_view(), name='employee-filter'),
    path('worker/add/', EmployeeAddView.as_view(), name='employee-add'),
    path('worker/delete/', EmployeeDeleteView.as_view(), name='employee-del'),
    path('worker/search/', EmployeeSearch.as_view(), name='employee-search'),
    path('generate-naprav/', MedicalDirectionView.as_view(), name='naprav'),
    path('notifications', NotificationListView.as_view(), name='notifications'),
    path('forbidden', ForbiddenView.as_view(), name='forbidden'),
    path('files/upload/', FileUploadView.as_view(), name='file-upload'),
    path('files/delete/', FileDeleteView.as_view(), name='file-delete'),
    path('files/list/<str:file_type>/<int:object_id>/', FileListView.as_view(), name='file-list'),
    path('files/preview/<int:file_id>/', FilePreviewView.as_view(), name='file-preview'),
    path('user', GetCurentUserDetails.as_view(), name='current-user'),
]