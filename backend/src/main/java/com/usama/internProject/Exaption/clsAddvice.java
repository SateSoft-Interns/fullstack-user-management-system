package com.usama.internProject.Exaption;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;


@ControllerAdvice
public class clsAddvice {
	@ResponseBody
	@ExceptionHandler(clsError.class)
	@ResponseStatus(HttpStatus.FOUND)
	public Map<String, String> MapExceptionHundler(clsError exception){
		
		Map<String,String> errorMap = new HashMap<>();
		errorMap.put("errorMassege", exception.getLocalizedMessage());
		return errorMap;
	}
}
