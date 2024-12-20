import { Collection, MongoClient } from "mongodb";
import {
  CourseInformation,
  ReceivedUserDataOnClient,
  Role,
  SentUserDataFromClient,
  UserCol,
} from "./types";
import md5 from "md5";
import useSWR from "swr";

export async function validateLogin(
  email: string,
  password: string,
  usersCollection: Collection<UserCol>
) {
  const user = await usersCollection.findOne({ email: email });
  
  if (!user) {
    console.log("User not found with email:", email);
    return null;
  }
  
  const passwordHash = md5(password);
  if (user.passwordHash !== passwordHash) {
    console.log("Password mismatch for user:", email);
    return null;
  }

  return {
    email: user.email,
    name: user.name,
    image: user.profilePicture,
  };
}

export async function getRoleAndId(
  email: string,
  usersCollection: Collection<UserCol>
) {
  const user = await usersCollection.findOne({ email: email });

  if (!user) {
    console.log("User not found for role and id with email:", email);
    return { role: null, id: null };
  }

  const role = user.role;
  const id = user._id;

  return { role, id };
}

export function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// @ts-ignore
export const fetcher = (...args) =>
  // @ts-ignore

  fetch(...args)
    .then((res) => res.json())
    .catch((err) => console.error(err));

export function getRoleColor(role: Role | "All") {
  let roleColor = "gray";
  if (role === "Student") {
    roleColor = "blue";
  } else if (role === "Admin" || role === "All") {
    roleColor = "red";
  } else if (role === "Faculty") {
    roleColor = "green";
  }
  return roleColor;
}
export async function editUser(
  newUserData: SentUserDataFromClient & { _id: string }
) {
  const formData = new FormData();

  //allowed entries are name, profile picture, phone and password only:
  const allowedEntries = [
    "name",
    "phone",
    "password",
    "profilePicture",
    "userId",
    "oldPicture",
  ];

  // the key should only consider those entries which are not empty and allowed

  for (let key in newUserData) {
    if (
      allowedEntries.includes(key) &&
      newUserData[key as keyof SentUserDataFromClient]
    ) {
      // @ts-ignore
      formData.append(key, newUserData[key]);
    }
  }
  if (!formData.get("profilePicture")) {
    formData.delete("oldPicture");
  }
  if (newUserData.hasOwnProperty("_id")) {
    formData.append("userId", newUserData._id);
  }

  const res = await fetch("/api/user", {
    method: "PUT",
    body: formData,
  });

  return res;
}

export function formatDateTime(date: Date) {
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const formattedTime = time.toLowerCase().replace(/\s/g, "");

  const formattedDate = date.toLocaleDateString(["en-GB"], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedDateTime = `${formattedTime} • ${formattedDate}`;
  return formattedDateTime;
}

export function escapeMarkdown(text: string) {
  const markdownRegex = /[#\][*_~`!@#$%^&*()"']/g;

  // Replace all matched markdown elements with an empty string
  const resultText = text.replace(markdownRegex, "");

  return resultText;
}

export function useUserSearch(searchQuery: string, role: string, page: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/allUsers/search?searchQuery=${searchQuery}&page=${page}&role=${role}`,
    fetcher
  );
  return {
    users: data as ReceivedUserDataOnClient[],
    isLoading,
    error: error,
    mutate,
  };
}

export function useCourses(
  page: number,
  search: string,
  type: "all" | "enrolled" | "notenrolled" | "teaching"
) {
  const { data, isLoading, error, mutate } = useSWR(
    `/api/course/list?page=${page}&type=${type}&searchQuery=${search}`,
    fetcher
  );
  return {
    courses: data,
    isLoading,
    error,
    mutate,
  };
}
export function useCoursePage(courseId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/course/${courseId}`,
    fetcher
  );
  return {
    course: data as CourseInformation,
    isLoading,
    error,
    mutate,
  };
}

export function useCourseMembers(
  courseId: string,
  page: number,
  search: string,
  memberType: "student" | "faculty",
  notEnrolledOnly = false
) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/course/${courseId}/member?page=${page}&memberType=${memberType}&searchQuery=${search}&&notEnrolledOnly=${notEnrolledOnly}`,
    fetcher
  );
  return {
    members: data as ReceivedUserDataOnClient[],
    isLoading,
    error,
    mutate,
  };
}
