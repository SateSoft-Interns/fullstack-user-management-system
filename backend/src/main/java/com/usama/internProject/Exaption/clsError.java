package com.usama.internProject.Exaption;

public class clsError extends RuntimeException {

	public clsError(Long id)
	{
		super("Could not found the user with ID "+id);
	}
}
