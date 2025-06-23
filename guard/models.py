from datetime import date
from django.db import models
from django.contrib.auth.models import User

class Employee(models.Model):
    GENDER_CHOICES = [
        ('M', 'Мужской'),
        ('F', 'Женский'),
    ]

    STATUS_CHOICES = [
        ('W', 'Работает'),
        ('V', 'В отпуске'),
        ('BT', 'В командировке'),
        ('S', 'На больничном')
    ]

    FIO = models.CharField(max_length=255, verbose_name="ФИО")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Пол")
    birthday = models.DateField(verbose_name="Дата рождения")
    position = models.CharField(max_length=255, verbose_name="Должность")
    is_edu = models.BooleanField(default=False, verbose_name="сейчас обучается")
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, verbose_name="Статус")
    department = models.TextField(
        max_length=1000, 
        blank=True, 
        null=True,
        verbose_name="Структурное подразделение"
    )
    oms_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name="Номер полиса ОМС"
    )
    dms_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name="Номер полиса ДМС"
    )

    class Meta:
        verbose_name = 'Сотрудники'
        verbose_name_plural = 'Сотрудники'
    
    def get_age(self):
        today = date.today()
        return today.year - self.birthday.year - (
            (today.month, today.day) < (self.birthday.month, self.birthday.day)
        )

    def __str__(self):
        return self.FIO

class Education(models.Model):
    PROGRAM_CHOICES = [
        ('ot_managers', 'Охрана труда руководителей и специалистов'),
        ('ot_teachers', 'Охрана труда профессорско-преподавательского состава'),
        ('first_aid', 'Оказание первой помощи'),
        ('fire_safety', 'Пожарный минимум'),
        ('electrical_safety', 'Электробезопасность'),
        ('sanitary_minimum', 'Санитарный минимум'),
        ('civil_defense', 'Гражданская оборона и чрезвычайные ситуации'),
        ('anti_terror', 'Антитеррор'),
    ]

    owner = models.ForeignKey(Employee, 
                              on_delete=models.CASCADE, 
                              related_name='educations', 
                              verbose_name="Сотрудник")
    program = models.CharField(
        max_length=50,
        choices=PROGRAM_CHOICES,
        verbose_name="Программа обучения"
    )
    protocol_num = models.CharField(max_length=255, verbose_name="Номер протокола")
    udostoverenie_num = models.CharField(max_length=255, verbose_name="Номер удостоверения")
    hours = models.FloatField(verbose_name="Количество часов")
    date_from = models.DateField(verbose_name="Дата начала")
    date_to = models.DateField(verbose_name="Дата окончания")

    class Meta:
        verbose_name = 'Обучение'
        verbose_name_plural = 'Обучение'
        indexes = [
            models.Index(fields=['date_to']),
        ]

    def __str__(self):
        return f"{self.get_program_display()} ({self.owner.FIO})"

class Med(models.Model):
    TYPE_CHOICHES = [
        ('periodic', 'Периодический'),
        ('preliminary', 'Предварительный'),
        ('fluorography', 'Флюорография'),
        ('psych_examination', 'Псих. Освидетельствование'),        
    ]

    owner = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='medical', verbose_name="Сотрудник")
    type = models.CharField(max_length=20, verbose_name="тип", choices=TYPE_CHOICHES)
    date_from = models.DateField(verbose_name="Дата начала")
    date_to = models.DateField(verbose_name="Дата окончания")

    class Meta:
        verbose_name = 'Медосмотры'
        verbose_name_plural = 'Медосмотры'
        indexes = [
            models.Index(fields=['date_to']),
        ]

    def __str__(self):
        return f"{self.name} ({self.owner.FIO})"
    
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    med = models.ForeignKey('Med', on_delete=models.CASCADE, null=True, blank=True)
    education = models.ForeignKey('Education', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'med', 'is_read']),
            models.Index(fields=['user', 'education', 'is_read']),
        ]

class FileAttachment(models.Model):
    FILE_TYPES = [
        ('med', 'Медосмотр'),
        ('education', 'Обучение'),
    ]

    file = models.FileField(upload_to='attachments/%Y/%m/%d/', verbose_name="Файл")
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, verbose_name="Тип записи")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки")
    
    # Связи с моделями Med и Education (может быть только одна из них)
    med = models.ForeignKey(
        Med, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='attachments',
        verbose_name="Медосмотр"
    )
    education = models.ForeignKey(
        Education, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='attachments',
        verbose_name="Обучение"
    )

    class Meta:
        verbose_name = 'Прикрепленный файл'
        verbose_name_plural = 'Прикрепленные файлы'
        constraints = [
            models.CheckConstraint(
                check=models.Q(med__isnull=False) | models.Q(education__isnull=False),
                name='not_both_null'
            ),
            models.CheckConstraint(
                check=~(models.Q(med__isnull=False) & models.Q(education__isnull=False)),
                name='not_both_not_null'
            ),
        ]

    def get_file_size(self, human_readable=True):
        """
        Returns the size of the file in bytes or in a human-readable format.
        
        Args:
            human_readable (bool): If True, returns size in a human-readable format (e.g., '1.2 MB').
                                  If False, returns size in bytes.
        
        Returns:
            str or int: File size in human-readable format (if human_readable=True) or in bytes (if human_readable=False).
            Returns None if the file does not exist.
        """
        try:
            if self.file and hasattr(self.file, 'size'):
                size_bytes = self.file.size
                if human_readable:
                    # Convert to human-readable format
                    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                        if size_bytes < 1024:
                            return f"{size_bytes:.1f} {unit}"
                        size_bytes /= 1024
                    return f"{size_bytes:.1f} PB"  # In case of extremely large files
                return size_bytes
            return None
        except FileNotFoundError:
            return None

    def __str__(self):
        return f"{self.file.name} ({self.get_file_type_display()})"