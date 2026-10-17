# 🔬 Medical Image Deep Learning (Project MONAI)

> **Source:** [Project-MONAI/MONAI](https://github.com/Project-MONAI/MONAI)
> **Domain:** PyTorch-based framework for healthcare imaging, DICOM/NIfTI processing, 3D segmentation, classification, and self-supervised pretraining.

---

## 🎯 Architectural Patterns in MONAI

MONAI extends PyTorch specifically for high-dimensional medical imaging datasets (3D volumetric CT/MRI, 4D temporal cardiac MRI, whole slide pathology).

### 1. Dictionary-Based Transform Pipelines (`Compose`)
Medical imaging requires transformations that preserve coordinate alignment across intensity images and multi-label segmentation masks:

```python
from monai.transforms import (
    Compose, LoadImaged, EnsureChannelFirstd, Orientationd, 
    Spacingd, ScaleIntensityRanged, CropForegroundd, RandCropByPosNegLabeld
)

train_transforms = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]),
    Orientationd(keys=["image", "label"], axcodes="RAS"),
    Spacingd(keys=["image", "label"], pixdim=(1.0, 1.0, 1.0), mode=("bilinear", "nearest")),
    ScaleIntensityRanged(keys=["image"], a_min=-1000, a_max=400, b_min=0.0, b_max=1.0, clip=True),
    CropForegroundd(keys=["image", "label"], source_key="image"),
    RandCropByPosNegLabeld(
        keys=["image", "label"],
        label_key="label",
        spatial_size=(96, 96, 96),
        pos=1, neg=1, num_samples=4
    ),
])
```

### 2. Volumetric Sliding Window Inference
Handles memory limits when running deep 3D networks (UNet, SwinUNETR, V-Net) on massive CT/MRI volumes:

```python
from monai.inferers import sliding_window_inference

def segment_full_volume(model, val_data, roi_size=(96, 96, 96), sw_batch_size=4):
    """
    Performs memory-efficient sliding-window inference with Gaussian overlap blending.
    """
    model.eval()
    val_outputs = sliding_window_inference(
        inputs=val_data["image"],
        roi_size=roi_size,
        sw_batch_size=sw_batch_size,
        predictor=model,
        overlap=0.5,
        mode="gaussian"
    )
    return val_outputs
```

---

## 🛡️ Clinical Anonymization & Data Hygiene

* **DICOM De-identification (HIPAA Safe Harbor):** Strip all PHI tags (PatientName `0010,0010`, PatientID `0010,0020`, BirthDate `0010,0030`, StudyDate `0008,0020`, InstitutionName `0008,0080`) before feeding images into training or external AI pipelines.
* **Voxel Geometry Integrity:** Always preserve origin, spacing, and directional cosines to prevent image flip or spatial distortion during surgical registration.
