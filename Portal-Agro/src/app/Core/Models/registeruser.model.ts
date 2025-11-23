export interface RegisterUserModel {
    email:          string;
    password:       string;
    firstName:      string;
    lastName:       string;
    identification: string;
    phoneNumber:    string;
    address:        string;
    cityId:         number;
}

export interface RequestEmailVerificationModel {
  email: string;
}

export interface ConfirmEmailVerificationModel {
  email: string;
  code: string;
}
